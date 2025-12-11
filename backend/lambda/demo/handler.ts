import {
  DynamoDBClient,
  ConditionalCheckFailedException,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLES: Record<string, string | undefined> = {
  posts: process.env.POSTS_TABLE,
  users: process.env.USERS_TABLE,
  comments: process.env.COMMENTS_TABLE,
};

const response = (
  statusCode: number,
  body: Record<string, unknown>
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  },
  body: JSON.stringify(body),
});

const pickTable = (resource: string | undefined) => {
  if (!resource || !TABLES[resource]) {
    throw new Error("Unsupported resource");
  }
  return TABLES[resource] as string;
};

const parseResource = (event: APIGatewayProxyEvent) => {
  // Support /posts, /users, /comments and /posts/{id}/comments
  const path = event.pathParameters || {};
  const resourceRoot = event.resource?.split("/").filter(Boolean)[0]; // posts|users|comments
  const postIdFromPath = path.id; // when /posts/{id}/comments
  const commentIdFromPath = (path as any).commentId;
  const resourceName =
    resourceRoot === "posts" && event.resource?.includes("comments")
      ? "comments"
      : resourceRoot;

  return { resourceName, postIdFromPath, commentIdFromPath };
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    const { resourceName, postIdFromPath, commentIdFromPath } = parseResource(event);
    const tableName = pickTable(resourceName);
    const id = commentIdFromPath || event.pathParameters?.id;

    if (method === "GET" && !id) {
      // if /posts/{id}/comments -> filter by post_id
      if (resourceName === "comments" && postIdFromPath) {
        const res = await docClient.send(
          new ScanCommand({
            TableName: tableName,
            FilterExpression: "#pid = :pid",
            ExpressionAttributeNames: { "#pid": "post_id" },
            ExpressionAttributeValues: { ":pid": postIdFromPath },
          })
        );
        const items = res.Items ?? [];
        return response(200, { data: items, total: items.length });
      }
      const res = await docClient.send(new ScanCommand({ TableName: tableName }));
      const items = res.Items ?? [];
      return response(200, { data: items, total: items.length });
    }

    if (method === "GET" && id) {
      const res = await docClient.send(
        new GetCommand({ TableName: tableName, Key: { id } })
      );
      if (!res.Item) {
        return response(404, { message: "Not found" });
      }
      return response(200, { data: res.Item });
    }

    if (method === "POST") {
      if (!event.body) return response(400, { message: "Request body required" });
      const payload = JSON.parse(event.body);
      // posts は published_at を未指定なら当日の日付で自動補完
      if (resourceName === "posts" && !payload.published_at) {
        payload.published_at = new Date().toISOString().slice(0, 10);
      }
      // comments: /posts/{id}/comments 経由なら post_id をパスから設定
      if (resourceName === "comments" && postIdFromPath) {
        payload.post_id = postIdFromPath;
      }
      // author は JWT から上書きする（フロント入力を信頼しない）
      const claims = (event.requestContext.authorizer as any)?.claims;
      const username =
        claims?.["cognito:username"] ||
        claims?.["username"] ||
        claims?.["email"] ||
        "anonymous";
      payload.author = username;

      const item = { id: randomUUID(), ...payload };
      await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
      return response(201, { data: item });
    }

    if (method === "PUT" && id) {
      if (!event.body) return response(400, { message: "Request body required" });
      const payload = JSON.parse(event.body);
      const updateExpressions: string[] = [];
      const exprValues: Record<string, unknown> = {};
      const exprNames: Record<string, string> = {};

      Object.entries(payload).forEach(([key, value]) => {
        updateExpressions.push(`#${key} = :${key}`);
        exprNames[`#${key}`] = key;
        exprValues[`:${key}`] = value;
      });

      if (updateExpressions.length === 0) {
        return response(400, { message: "No fields to update" });
      }

      try {
        const res = await docClient.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { id },
            UpdateExpression: `SET ${updateExpressions.join(", ")}`,
            ExpressionAttributeNames: exprNames,
            ExpressionAttributeValues: exprValues,
            ConditionExpression: "attribute_exists(id)",
            ReturnValues: "ALL_NEW",
          })
        );
        return response(200, { data: res.Attributes });
      } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
          return response(404, { message: "Not found" });
        }
        throw err;
      }
    }

    if (method === "DELETE" && id) {
      try {
        await docClient.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { id },
            ConditionExpression: "attribute_exists(id)",
          })
        );
      } catch (err) {
        if (err instanceof ConditionalCheckFailedException) {
          return response(404, { message: "Not found" });
        }
        throw err;
      }
      return response(200, { data: { id } });
    }

    return response(405, { message: "Method not allowed" });
  } catch (error) {
    console.error("Error handling request", error);
    return response(500, { message: "Internal Server Error" });
  }
};
