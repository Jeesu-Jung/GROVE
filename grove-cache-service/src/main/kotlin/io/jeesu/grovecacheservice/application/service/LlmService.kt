package io.jeesu.grovecacheservice.application.service

import io.jeesu.grovecacheservice.infrastructure.external.client.OpenAIClient
import io.jeesu.grovecacheservice.infrastructure.external.client.AnthropicClient
import io.jeesu.grovecacheservice.infrastructure.external.client.OpenRouterClient
import io.jeesu.grovecacheservice.infrastructure.external.dto.AnthropicClientDto
import io.jeesu.grovecacheservice.infrastructure.external.dto.OpenAIClientDto
import io.jeesu.grovecacheservice.infrastructure.external.dto.OpenRouterClientDto
import io.jeesu.grovecacheservice.presentation.dto.*
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service

@Service
class LlmService(
    private val openAIClient: OpenAIClient,
    private val anthropicClient: AnthropicClient,
    private val openRouterClient: OpenRouterClient
) {
    @Cacheable(
        cacheManager = "jsonCacheInfinity",
        cacheNames = ["openai"],
        key = "#body.model + '|' + T(io.jeesu.grovecacheservice.infrastructure.util.HashUtil).Companion.generateKey(#body.messages[0].content) + '|' + #body.max_tokens + '|' + #body.max_completion_tokens"
    )
    fun openaiChatCompletions(body: GPTDto.ChatCompletionsRequest, authorization: String?): OpenAIClientDto.Response {
        if (authorization.isNullOrEmpty()) throw IllegalArgumentException("API 키가 필요합니다")

        val req = OpenAIClientDto.Request(
            model = body.model,
            messages = body.messages.map { OpenAIClientDto.ChatMessage(role = it.role, content = it.content) },
            temperature = body.temperature ?: 1.0,
            max_tokens = if (!body.model.startsWith("gpt-5")) body.max_tokens else null,
            max_completion_tokens = if (body.model.startsWith("gpt-5")) body.max_completion_tokens else null
        )

        try {
            return openAIClient.chatCompletions(authorization, req)
        } catch (e: Exception) {
            throw RuntimeException("외부 API 호출 실패")
        }
    }

    @Cacheable(
        cacheManager = "jsonCacheInfinity",
        cacheNames = ["openrouter"],
        key = "#body.model + '|' + T(io.jeesu.grovecacheservice.infrastructure.util.HashUtil).Companion.generateKey(#body.messages[0].content) + '|' + #body.max_tokens"
    )
    fun openRouterChatCompletions(
        body: OpenRouterDto.ChatCompletionsRequest,
        authorization: String?
    ): OpenRouterClientDto.Response {
        if (authorization.isNullOrEmpty()) throw IllegalArgumentException("API 키가 필요합니다")

        val req = OpenRouterClientDto.Request(
            model = body.model,
            messages = body.messages.map { OpenRouterClientDto.ChatMessage(role = it.role, content = it.content) },
            temperature = body.temperature ?: 1.0,
            max_tokens = body.max_tokens
        )

        try {
            return openRouterClient.chatCompletions(authorization, req)
        } catch (e: Exception) {
            throw RuntimeException("외부 API 호출 실패")
        }
    }

    @Cacheable(
        cacheManager = "jsonCacheInfinity",
        cacheNames = ["antropic"],
        key = "#body.model + '|' + T(io.jeesu.grovecacheservice.infrastructure.util.HashUtil).Companion.generateKey(#body.messages[0].content) + '|' + #body.max_tokens"
    )
    fun claudeMessages(
        body: ClaudeDto.ClaudeMessagesRequest,
        apiKey: String?,
        version: String?
    ): AnthropicClientDto.Response {
        if (apiKey.isNullOrEmpty()) throw IllegalArgumentException("API 키가 필요합니다")

        val req = AnthropicClientDto.Request(
            model = body.model,
            max_tokens = body.max_tokens,
            messages = body.messages.map { AnthropicClientDto.Message(it.role, it.content) }
        )
        try {
            return anthropicClient.messages(apiKey = apiKey, version = version ?: "2023-06-01", body = req)
        } catch (e: Exception) {
            throw RuntimeException("외부 API 호출 실패")
        }
    }
}
