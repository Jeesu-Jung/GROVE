package io.jeesu.grovecacheservice.presentation.dto

class ClaudeDto {
    data class ClaudeMessage(
        val role: String,
        val content: String
    )

    data class ClaudeMessagesRequest(
        val model: String,
        val max_tokens: Int,
        val messages: List<ClaudeMessage>
    )
}
