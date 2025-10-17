package io.jeesu.weavy.presentation.controller

import io.jeesu.weavy.application.ChatBotService
import io.jeesu.weavy.presentation.dto.ChatRequest
import io.jeesu.weavy.presentation.dto.ChatResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/chat")
class ChatController(
    private val chatBotService: ChatBotService
) {

    @PostMapping
    fun chat(@RequestBody req: ChatRequest): ResponseEntity<ChatResponse> {
        val answer = chatBotService.answer(req.query)
        return ResponseEntity.ok(ChatResponse(answer))
    }
}
