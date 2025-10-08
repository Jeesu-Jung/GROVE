package io.jeesu.grovetaskmixtureservice.presentation.controller

import io.jeesu.grovetaskmixtureservice.application.service.BestModelService
import io.jeesu.grovetaskmixtureservice.application.service.mapper.BestModelMapper
import io.jeesu.grovetaskmixtureservice.presentation.dto.BestModelDto
import io.jeesu.grovetaskmixtureservice.presentation.dto.ApiResponse
import io.jeesu.grovetaskmixtureservice.presentation.dto.Meta
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/task-mixture")
class BestModelController(
    private val service: BestModelService,
    private val mapper: BestModelMapper
) {
    @GetMapping("/best-models")
    fun all(): ResponseEntity<ApiResponse<List<BestModelDto.BestModelResponse>>> {
        val data = service.getAll().map { mapper.toBestModelResponse(it) }
        val meta = Meta(totalCount = data.size)
        return ResponseEntity.ok(ApiResponse.success(data, meta = meta))
    }
}
