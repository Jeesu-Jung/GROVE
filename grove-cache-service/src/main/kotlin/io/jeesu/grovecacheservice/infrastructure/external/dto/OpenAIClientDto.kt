package io.jeesu.grovecacheservice.infrastructure.external.dto

import com.fasterxml.jackson.annotation.JsonInclude

class OpenAIClientDto {
    data class ChatMessage(
        val role: String,
        val content: String
    )

    data class ChatChoiceMessage(
        val role: String,
        val content: String
    )

    @JsonInclude(JsonInclude.Include.NON_NULL)
    data class Request(
        val model: String,
        val messages: List<ChatMessage>,
        val temperature: Double? = 1.0,
        val max_tokens: Int? = null,
        val max_completion_tokens: Int? = null
    )

    data class ResponseChoice(val index: Int, val message: ChatChoiceMessage)
    data class Response(val choices: List<ResponseChoice>)
}
