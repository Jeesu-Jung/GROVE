package io.jeesu.weavy.application

import dev.langchain4j.data.document.Document
import dev.langchain4j.data.document.DocumentParser
import dev.langchain4j.data.document.DocumentSplitter
import dev.langchain4j.data.document.loader.FileSystemDocumentLoader.loadDocument
import dev.langchain4j.data.document.parser.TextDocumentParser
import dev.langchain4j.data.document.splitter.DocumentSplitters
import dev.langchain4j.data.embedding.Embedding
import dev.langchain4j.data.segment.TextSegment
import dev.langchain4j.memory.ChatMemory
import dev.langchain4j.memory.chat.MessageWindowChatMemory
import dev.langchain4j.model.chat.ChatModel
import dev.langchain4j.model.embedding.EmbeddingModel
import dev.langchain4j.model.embedding.onnx.bgesmallenv15q.BgeSmallEnV15QuantizedEmbeddingModel
import dev.langchain4j.model.openai.OpenAiChatModel
import dev.langchain4j.model.openai.OpenAiChatModelName.GPT_5_MINI
import dev.langchain4j.rag.content.retriever.ContentRetriever
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever
import dev.langchain4j.service.AiServices
import dev.langchain4j.store.embedding.EmbeddingStore
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore
import io.jeesu.weavy.domain.Assistant
import io.jeesu.weavy.infrastucture.util.Utils.toPath
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class ChatBotService(
    @Value("\${openai.api-key}") private val openaiApiKey: String
) {

    private val assistant: Assistant = createAssistant("documents/weave-document.txt")

    fun answer(query: String?): String = assistant.answer(query)

    private fun createAssistant(documentPath: String): Assistant {
        val chatModel: ChatModel = OpenAiChatModel.builder()
            .apiKey(openaiApiKey)
            .modelName(GPT_5_MINI)
            .build()

        val documentParser: DocumentParser = TextDocumentParser()
        val document: Document = loadDocument(toPath(documentPath), documentParser)

        val splitter: DocumentSplitter = DocumentSplitters.recursive(300, 0)
        val segments: List<TextSegment> = splitter.split(document)

        val embeddingModel: EmbeddingModel = BgeSmallEnV15QuantizedEmbeddingModel()
        val embeddings: List<Embedding> = embeddingModel.embedAll(segments).content()

        val embeddingStore: EmbeddingStore<TextSegment> = InMemoryEmbeddingStore()
        embeddingStore.addAll(embeddings, segments)

        val contentRetriever: ContentRetriever = EmbeddingStoreContentRetriever.builder()
            .embeddingStore(embeddingStore)
            .embeddingModel(embeddingModel)
            .maxResults(2)
            .minScore(0.5)
            .build()

        val chatMemory: ChatMemory = MessageWindowChatMemory.withMaxMessages(10)

        return AiServices.builder(Assistant::class.java)
            .chatModel(chatModel)
            .contentRetriever(contentRetriever)
            .chatMemory(chatMemory)
            .build()
    }
}
