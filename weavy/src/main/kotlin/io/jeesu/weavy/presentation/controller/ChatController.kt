package io.jeesu.weavy.presentation.controller

import io.jeesu.weavy.application.ChatBotService
import io.jeesu.weavy.presentation.dto.ChatRequest
import io.jeesu.weavy.presentation.dto.ChatResponse
import io.jeesu.weavy.presentation.dto.IngestResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class ChatController(
    private val chatBotService: ChatBotService
) {

    @PostMapping("/chat")
    fun chat(@RequestBody req: ChatRequest): ResponseEntity<ChatResponse> {
        val answer = chatBotService.answer(req.query)
        return ResponseEntity.ok(ChatResponse(answer))
    }

    @PostMapping("/ingest")
    fun ingest(): ResponseEntity<IngestResponse> {
        val count = chatBotService.ingestDocument()
        return ResponseEntity.ok(IngestResponse(count))
    }
}
