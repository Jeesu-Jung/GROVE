package io.jeesu.grovecacheservice.presentation.dto

class OpenRouterDto {
    data class ChatCompletionsMessage(
        val role: String,
        val content: String
    )

    data class ChatCompletionsRequest(
        val model: String,
        val messages: List<ChatCompletionsMessage>,
        val temperature: Double? = null,
        val max_tokens: Int? = null
    )
}
