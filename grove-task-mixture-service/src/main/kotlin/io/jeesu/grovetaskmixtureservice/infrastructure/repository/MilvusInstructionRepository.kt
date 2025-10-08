package io.jeesu.grovetaskmixtureservice.infrastructure.repository

import io.jeesu.grovetaskmixtureservice.domain.instruction.Instruction
import io.jeesu.grovetaskmixtureservice.domain.instruction.InstructionRepository
import io.jeesu.grovetaskmixtureservice.infrastructure.config.MilvusProperties
import io.milvus.client.MilvusClient
import io.milvus.param.MetricType
import io.milvus.param.R
import io.milvus.param.collection.LoadCollectionParam
import io.milvus.param.dml.SearchParam
import io.milvus.response.SearchResultsWrapper
import org.springframework.stereotype.Repository

@Repository
class MilvusInstructionRepository(
    private val milvusClient: MilvusClient,
    private val properties: MilvusProperties
) : InstructionRepository {

    override fun searchByVector(vector: List<Float>, size: Int): List<Instruction> {
        milvusClient.loadCollection(
            LoadCollectionParam.newBuilder()
                .withCollectionName(properties.instructionCollection)
                .build()
        )

        val param = SearchParam.newBuilder()
            .withCollectionName(properties.instructionCollection)
            .withMetricType(MetricType.COSINE)
            .withVectorFieldName("vector")
            .withTopK(size)
            .withLimit(size.toLong())
            .withOutFields(listOf("id", "vector", "input", "inputs", "constraint", "output", "instruction"))
            .withFloatVectors(listOf(vector))
            .build()

        val res: R<io.milvus.grpc.SearchResults> = milvusClient.search(param)
        if (res.status != R.Status.Success.getCode()) return emptyList()

        val wrapper = SearchResultsWrapper(res.data.results)
        val results = mutableListOf<Instruction>()

        // Search 결과는 여러 쿼리 벡터에 대한 topK가 붙으므로, 첫 쿼리 벡터(index 0)만 사용
        val targetIndex = 0
        val ids = wrapper.getFieldData("id", targetIndex)
        val vectors = try { wrapper.getFieldData("vector", targetIndex) } catch (_: Exception) { null }
        val input = wrapper.getFieldData("input", targetIndex)
        val inputs = wrapper.getFieldData("inputs", targetIndex)
        val constraint = wrapper.getFieldData("constraint", targetIndex)
        val output = wrapper.getFieldData("output", targetIndex)
        val instruction = wrapper.getFieldData("instruction", targetIndex)

        val rowCount = ids.size
        for (i in 0 until rowCount) {
            val id = (ids[i] as Number).toLong()
            val vec = (vectors?.get(i) as? List<*>)?.map { (it as Number).toFloat() } ?: emptyList()
            val in1 = input[i]?.toString() ?: ""
            val in2 = inputs[i]?.toString() ?: ""
            val cons = constraint[i]?.toString() ?: ""
            val out = output[i]?.toString() ?: ""
            val inst = instruction[i]?.toString() ?: ""
            results.add(Instruction(id, vec, in1, in2, cons, out, inst))
        }

        return results
    }
}
