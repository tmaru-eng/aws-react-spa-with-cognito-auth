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
const TABLE_NAME = process.env.TABLE_NAME as string;

type Item = {
  id: string;
  title: string;
  views: number;
  published_at: string;
};

const response = (
  statusCode: number,
  body: Record<string, unknown>
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    const id = event.pathParameters?.id;

    if (method === "GET" && !id) {
      const res = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
      const items = (res.Items ?? []) as Item[];
      return response(200, { data: items, total: items.length });
    }

    if (method === "GET" && id) {
      const res = await docClient.send(
        new GetCommand({ TableName: TABLE_NAME, Key: { id } })
      );
      if (!res.Item) {
        return response(404, { message: "Not found" });
      }
      return response(200, { data: res.Item });
    }

    if (method === "POST") {
      if (!event.body) {
        return response(400, { message: "Request body is required" });
      }
      const payload = JSON.parse(event.body);
      const title = payload.title as string | undefined;
      const views = Number(payload.views ?? 0);
      if (!title) {
        return response(400, { message: "title is required" });
      }
      const item: Item = {
        id: randomUUID(),
        title,
        views: Number.isFinite(views) ? views : 0,
        published_at: payload.published_at || new Date().toISOString().slice(0, 10),
      };
      await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
      return response(201, { data: item });
    }

    if (method === "PUT" && id) {
      if (!event.body) {
        return response(400, { message: "Request body is required" });
      }
      const payload = JSON.parse(event.body);
      const title = payload.title as string | undefined;
      const views = payload.views;
      const published_at = payload.published_at as string | undefined;

      const updateExpressions = [];
      const exprValues: Record<string, unknown> = {};
      const exprNames: Record<string, string> = {};

      if (title !== undefined) {
        updateExpressions.push("#t = :title");
        exprValues[":title"] = title;
        exprNames["#t"] = "title";
      }
      if (views !== undefined) {
        updateExpressions.push("#v = :views");
        exprValues[":views"] = Number(views);
        exprNames["#v"] = "views";
      }
      if (published_at !== undefined) {
        updateExpressions.push("#p = :published_at");
        exprValues[":published_at"] = published_at;
        exprNames["#p"] = "published_at";
      }

      if (updateExpressions.length === 0) {
        return response(400, { message: "No fields to update" });
      }

      try {
        const res = await docClient.send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { id },
            UpdateExpression: `SET ${updateExpressions.join(", ")}`,
            ExpressionAttributeValues: exprValues,
            ExpressionAttributeNames: exprNames,
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
            TableName: TABLE_NAME,
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
