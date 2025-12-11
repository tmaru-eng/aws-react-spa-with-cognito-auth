import React from "react";
import { View, Heading, Text, Flex } from "@aws-amplify/ui-react";

const AuthHeader: React.FC = () => (
  <Flex
    direction="column"
    alignItems="center"
    padding="1.5rem"
    style={{ textAlign: "center" }}
  >
    <Heading level={3} marginBottom="0.5rem">
      React Admin Sample
    </Heading>
    <Text color="var(--amplify-colors-neutral-80)">
      Cognito サインイン後、管理画面へアクセスします。
    </Text>
  </Flex>
);

export default AuthHeader;
