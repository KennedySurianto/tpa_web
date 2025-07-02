import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { GetUserByUsernameRequest, User } from "../api/gen/user";
import { userClient } from "../api/grpc/userClient";

const isValidUser = async (username: string): Promise<boolean> => {
  const req: GetUserByUsernameRequest = { username };

  try {
    const res: User | null = await userClient.GetUserByUsername(req);
    return res !== null && res.username.toLowerCase() === username.toLowerCase();
  } catch (err) {
    console.error("Failed to validate user:", err);
    return false;
  }
};

interface Token {
  type: "mention" | "hashtag" | "text";
  value: string;
  valid?: boolean;
}

export function ProcessRichText({ text }: { text: string }) {
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    if (!text) return;

    const rawTokens = text.split(/(@\w+|#\w+)/g).map((token): Token => {
      if (token.startsWith("@")) return { type: "mention", value: token.substring(1) };
      if (token.startsWith("#")) return { type: "hashtag", value: token.substring(1) };
      return { type: "text", value: token };
    });

    console.log("rawTokens: ", rawTokens);

    // Validate mentions asynchronously
    const validateMentions = async () => {
      try {
        const validated: Token[] = await Promise.all(
          rawTokens.map(async (token) => {
            if (token.type === "mention") {
              const valid = await isValidUser(token.value);
              console.log("value: ", token.value, ", valid: ", valid);
              return { ...token, valid };
            }
            return token;
          }),
        );
        setTokens(validated);
      } catch (err) {
        console.error("validateMentions failed:", err);
      }
    };

    validateMentions();
  }, [text]);

  return (
    <>
      {tokens.map((token, i) => {
        if (token.type === "mention") {
          return token.valid ? (
            <Link key={i} to={`/${token.value}`} className="mention">
              <strong>@{token.value}</strong>
            </Link>
          ) : (
            `@${token.value}`
          );
        }

        if (token.type === "hashtag") {
          return (
            <Link key={i} to={`/search?q=${token.value}`} className="hashtag">
              <strong>#{token.value}</strong>
            </Link>
          );
        }

        return <span key={i}>{token.value}</span>;
      })}
    </>
  );
}
