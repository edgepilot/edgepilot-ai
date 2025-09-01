'use client';

import { useState } from "react";
import { CopilotTextarea } from "@copilotkit/react-textarea";
import "@copilotkit/react-textarea/styles.css";
 
export default function Test() {
  const [text, setText] = useState("");
 
  return (
    <CopilotTextarea
      className="custom-textarea-class"
      value={text}
      onValueChange={(value: string) => setText(value)}
      placeholder="Enter your text here..."
      autosuggestionsConfig={{
        textareaPurpose: "Provide context or purpose of the textarea.",
        chatApiConfigs: {
          suggestionsApiConfig: {
            maxTokens: 20,
            stop: [".", "?", "!"],
          },
        },
      }}
    />
  );
}