package io.jeesu.grovetaskmixtureservice.presentation.controller

import io.jeesu.grovetaskmixtureservice.application.service.AlpacaService
import io.jeesu.grovetaskmixtureservice.application.service.mapper.AlpacaMapper
import io.jeesu.grovetaskmixtureservice.presentation.dto.AlpacaDto
import io.jeesu.grovetaskmixtureservice.presentation.dto.ApiResponse
import io.jeesu.grovetaskmixtureservice.presentation.dto.Meta
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/task-mixture")
class AlpacaController(
    private val service: AlpacaService,
    private val mapper: AlpacaMapper
) {
    @GetMapping("/alpaca/search")
    fun search(searchRequest: AlpacaDto.SearchRequest): ResponseEntity<ApiResponse<List<AlpacaDto.SearchResponse>>> {
        val instructions = service.searchAlpacaInstruction(searchRequest)
        return ResponseEntity.ok(
            ApiResponse.success(
                instructions.map { mapper.toSearchResponse(it) },
                meta = Meta(totalCount = instructions.size)
            )
        )
    }
}
