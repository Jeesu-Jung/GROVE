package io.jeesu.grovecacheservice.presentation.controller

import io.jeesu.grovecacheservice.application.service.LlmService
import io.jeesu.grovecacheservice.infrastructure.external.dto.AnthropicClientDto
import io.jeesu.grovecacheservice.infrastructure.external.dto.OpenAIClientDto
import io.jeesu.grovecacheservice.infrastructure.external.dto.OpenRouterClientDto
import io.jeesu.grovecacheservice.presentation.dto.*
import org.springframework.http.HttpHeaders.AUTHORIZATION
import org.springframework.http.ResponseEntity
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RestController

@RestController
@Validated
class LlmController(
    private val llmService: LlmService
) {
    @PostMapping("/v1/chat/completions")
    fun chatCompletions(
        @RequestBody body: GPTDto.ChatCompletionsRequest,
        @RequestHeader(AUTHORIZATION, required = false) authorization: String?
    ): ResponseEntity<OpenAIClientDto.Response> {
        if (body.model.isBlank() || body.messages.isEmpty()) {
            return ResponseEntity.badRequest().build()
        }
        return try {
            val response = llmService.openaiChatCompletions(body, authorization)
            ResponseEntity.ok(response)
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        } catch (e: Exception) {
            ResponseEntity.status(502).build()
        }
    }

    @PostMapping("/v1/messages")
    fun claudeMessages(
        @RequestBody body: ClaudeDto.ClaudeMessagesRequest,
        @RequestHeader("x-api-key") apiKey: String,
        @RequestHeader("anthropic-version", required = false) version: String?
    ): ResponseEntity<AnthropicClientDto.Response> {
        if (body.model.isBlank() || body.messages.isEmpty()) {
            return ResponseEntity.badRequest().build()
        }
        return try {
            val response = llmService.claudeMessages(body, apiKey, version)
            ResponseEntity.ok(response)
        } catch (_: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        } catch (_: Exception) {
            ResponseEntity.status(502).build()
        }
    }

    @PostMapping("/api/v1/chat/completions")
    fun openRouterChatCompletions(
        @RequestBody body: OpenRouterDto.ChatCompletionsRequest,
        @RequestHeader(AUTHORIZATION, required = false) authorization: String?
    ): ResponseEntity<OpenRouterClientDto.Response> {
        if (body.model.isBlank() || body.messages.isEmpty()) {
            return ResponseEntity.badRequest().build()
        }
        return try {
            val response = llmService.openRouterChatCompletions(body, authorization)
            ResponseEntity.ok(response)
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        } catch (e: Exception) {
            ResponseEntity.status(502).build()
        }
    }
}
