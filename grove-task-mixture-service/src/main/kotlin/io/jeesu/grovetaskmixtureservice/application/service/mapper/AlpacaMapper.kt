package io.jeesu.grovetaskmixtureservice.application.service.mapper

import io.jeesu.grovetaskmixtureservice.domain.instruction.Instruction
import io.jeesu.grovetaskmixtureservice.presentation.dto.AlpacaDto
import org.springframework.stereotype.Component

@Component
class AlpacaMapper {
    fun toSearchResponse(instruction: Instruction): AlpacaDto.SearchResponse {
        return AlpacaDto.SearchResponse(
            input = instruction.input,
            inputs = instruction.inputs,
            constraint = instruction.constraint,
            output = instruction.output,
            instruction = instruction.instruction
        )
    }
}
