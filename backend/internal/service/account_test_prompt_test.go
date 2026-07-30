//go:build unit

package service

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/tidwall/gjson"
)

func TestAccountTestPayloadsUseCustomPrompt(t *testing.T) {
	t.Parallel()

	const prompt = "reply with pong"

	claudePayload, err := createTestPayload("claude-test", prompt)
	require.NoError(t, err)
	claudeBody, err := json.Marshal(claudePayload)
	require.NoError(t, err)
	require.Equal(t, prompt, gjson.GetBytes(claudeBody, "messages.0.content.0.text").String())

	openAIBody, err := json.Marshal(createOpenAITestPayload("gpt-test", false, prompt))
	require.NoError(t, err)
	require.Equal(t, prompt, gjson.GetBytes(openAIBody, "input.0.content.0.text").String())

	compactBody, err := json.Marshal(createOpenAICompactProbePayload("gpt-test", prompt))
	require.NoError(t, err)
	require.Equal(t, prompt, gjson.GetBytes(compactBody, "input.0.content").String())

	grokBody, err := buildGrokQuotaProbeBody("grok-test", prompt)
	require.NoError(t, err)
	require.Equal(t, prompt, gjson.GetBytes(grokBody, "input").String())
}

func TestAntigravityTestPayloadsUseCustomPrompt(t *testing.T) {
	t.Parallel()

	const prompt = "explain the connection status"
	service := &AntigravityGatewayService{}

	geminiBody, err := service.buildGeminiTestRequest("project-test", "gemini-test", prompt)
	require.NoError(t, err)
	require.Equal(t, prompt, gjson.GetBytes(geminiBody, "request.contents.0.parts.0.text").String())

	claudeBody, err := service.buildClaudeTestRequest("project-test", "claude-test", prompt)
	require.NoError(t, err)
	require.Equal(t, prompt, gjson.GetBytes(claudeBody, "request.contents.0.parts.0.text").String())
}

func TestAccountTestPayloadDefaultsToHi(t *testing.T) {
	t.Parallel()

	payload, err := createTestPayload("claude-test", "   ")
	require.NoError(t, err)
	body, err := json.Marshal(payload)
	require.NoError(t, err)
	require.Equal(t, defaultTextTestPrompt, gjson.GetBytes(body, "messages.0.content.0.text").String())
}
