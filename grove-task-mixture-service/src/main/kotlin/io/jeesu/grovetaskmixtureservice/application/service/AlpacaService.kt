package io.jeesu.grovetaskmixtureservice.application.service

import io.jeesu.grovetaskmixtureservice.domain.instruction.Instruction
import io.jeesu.grovetaskmixtureservice.domain.instruction.InstructionRepository
import io.jeesu.grovetaskmixtureservice.domain.mixture.BestModel
import io.jeesu.grovetaskmixtureservice.presentation.dto.AlpacaDto
import org.springframework.stereotype.Service

@Service
class AlpacaService(
    private val seedSentenceService: SeedSentenceService,
    private val bestModelService: BestModelService,
    private val instructionRepository: InstructionRepository,
) {
    private fun seedTypeCounts(bestModel: BestModel): List<Pair<String, Int>> = listOf(
        "Programming" to bestModel.programming,
        "Math solution" to bestModel.math,
        "Creative Writing" to bestModel.creativeWriting,
        "Grammar Correction" to bestModel.grammar,
        "History QA" to bestModel.history
    )

    fun searchAlpacaInstruction(searchRequest: AlpacaDto.SearchRequest): List<Instruction> {
        val bestModel = bestModelService.getTaskMixtureBestModel(
            model = searchRequest.model,
            dataSize = searchRequest.dataSize,
            task = searchRequest.task
        )

        val instructionList = mutableListOf<Instruction>()

        seedTypeCounts(bestModel)
            .asSequence()
            .filter { (_, count) -> count > 0 }
            .forEach { (seedType, count) ->
                val vector = seedSentenceService.getAvgVector(seedType)
                instructionList.addAll(instructionRepository.searchByVector(vector, count))
            }

        return instructionList.toList()
    }
}
