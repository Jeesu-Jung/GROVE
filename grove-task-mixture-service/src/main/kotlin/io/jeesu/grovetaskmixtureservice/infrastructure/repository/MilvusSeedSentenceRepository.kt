package io.jeesu.grovetaskmixtureservice.infrastructure.repository

import io.jeesu.grovetaskmixtureservice.domain.seed.SeedSentence
import io.jeesu.grovetaskmixtureservice.domain.seed.SeedSentenceRepository
import io.jeesu.grovetaskmixtureservice.infrastructure.config.MilvusProperties
import io.milvus.client.MilvusClient
import io.milvus.param.R
import io.milvus.param.collection.LoadCollectionParam
import io.milvus.param.dml.QueryParam
import io.milvus.grpc.QueryResults
import io.milvus.response.QueryResultsWrapper
import org.springframework.stereotype.Repository

@Repository
class MilvusSeedSentenceRepository(
    private val milvusClient: MilvusClient,
    private val properties: MilvusProperties
) : SeedSentenceRepository {

    override fun findAll(page: Int, size: Int): List<SeedSentence> {
        val offset = page * size
        milvusClient.loadCollection(
            LoadCollectionParam.newBuilder()
                .withCollectionName(properties.seedSentenceCollection)
                .build()
        )

        val query: R<QueryResults> = milvusClient.query(
            QueryParam.newBuilder()
                .withCollectionName(properties.seedSentenceCollection)
                .withExpr("id >= $offset")
                .withOffset(offset.toLong())
                .withLimit(size.toLong())
                .withOutFields(listOf("id", "sentence", "type", "vector"))
                .build()
        )

        if (query.status != R.Status.Success.getCode()) return emptyList()

        val wrapper = QueryResultsWrapper(query.data)
        val idData = wrapper.getFieldWrapper("id").getFieldData()
        val sentenceData = wrapper.getFieldWrapper("sentence").getFieldData()
        val typeData = try { wrapper.getFieldWrapper("type").getFieldData() } catch (_: Exception) { null }
        val vectorData = try { wrapper.getFieldWrapper("vector").getFieldData() } catch (_: Exception) { null }

        val results = mutableListOf<SeedSentence>()
        for (i in 0 until wrapper.rowCount.toInt()) {
            val id = (idData[i] as Number).toLong()
            val sentence = sentenceData[i]?.toString() ?: ""
            val type = typeData?.get(i)?.toString()
            val vector = (vectorData?.get(i) as? List<*>)?.map { (it as Number).toFloat() }
            results.add(SeedSentence(id, sentence, type, vector))
        }
        return results
    }
}
