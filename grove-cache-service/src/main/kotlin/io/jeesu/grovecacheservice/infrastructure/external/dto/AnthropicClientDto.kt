package io.jeesu.grovecacheservice.infrastructure.external.dto

class AnthropicClientDto {
    data class Message(val role: String, val content: String)
    data class Request(val model: String, val max_tokens: Int, val messages: List<Message>)
    data class ContentItem(val text: String)
    data class Response(val content: List<ContentItem>)
}
