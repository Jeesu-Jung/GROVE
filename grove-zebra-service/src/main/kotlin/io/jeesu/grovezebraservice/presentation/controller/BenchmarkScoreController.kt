package io.jeesu.grovezebraservice.presentation.controller

import io.jeesu.grovezebraservice.application.ModelBenchmarkService
import io.jeesu.grovezebraservice.domain.benchmark.BenchmarkScore
import io.jeesu.grovezebraservice.presentation.dto.ApiResponse
import io.jeesu.grovezebraservice.presentation.dto.BenchmarkDto
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/benchmark")
class BenchmarkScoreController(
    private val modelBenchmarkService: ModelBenchmarkService
) {
    @GetMapping("/models")
    fun all(): ResponseEntity<ApiResponse<List<BenchmarkScore>>> {
        val scores = modelBenchmarkService.findAll()
        return ResponseEntity.ok(ApiResponse.success(data = scores))
    }

    @GetMapping("/best-models")
    fun bestModels(request: BenchmarkDto.BestModelRequest): ResponseEntity<ApiResponse<BenchmarkDto.BestModelResponse>> {
        val superiorModels = modelBenchmarkService.findSuperiorModels(request)
        val similarityModels = modelBenchmarkService.findSimilarityModels(request)
        val superiorPlusSimilarityModels = modelBenchmarkService.findSuperiorPlusSimilarityModels(request)
        val response = BenchmarkDto.BestModelResponse(
            superior = superiorModels,
            similarity = similarityModels,
            superiorPlusSimilarity = superiorPlusSimilarityModels
        )
        return ResponseEntity.ok(ApiResponse.success(data = response))
    }

    @GetMapping("/similarity/search")
    fun getSimilarModel(request: BenchmarkDto.SimilarityModelRequest): ResponseEntity<ApiResponse<BenchmarkDto.SimilarityModelResponse>> {
        val similarModel = modelBenchmarkService.findSimilarModel(request)
        val response = BenchmarkDto.SimilarityModelResponse(model = similarModel)
        return ResponseEntity.ok(ApiResponse.success(data = response))
    }
}
