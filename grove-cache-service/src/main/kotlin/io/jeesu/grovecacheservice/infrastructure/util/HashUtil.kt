package io.jeesu.grovecacheservice.infrastructure.util

import org.apache.commons.codec.binary.Hex
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException
import java.util.*

class HashUtil {
    companion object {
        private val DEFAULT_DIGEST_ALGORITHM = "MD5"

        fun generateKey(value: Int): String {
            return generateKey(value.toString())
        }

        fun generateKey(value: Long): String {
            return generateKey(value.toString())
        }

        fun generateKey(text: String): String {
            return try {
                getHexString(text)
            } catch (exception: Exception) {
                "WARN(text)"
            }
        }

        fun generateKey(keyword: String, size: Int): String {
            return try {
                "$size:${getHexString(keyword)}"
            } catch (exception: Exception) {
                "WARN(size:keyword)"
            }
        }

        fun generateKey(long1: Long, long2: Long): String {
            return getHexString("$long1:$long2")
        }

        fun generateKey(long1: Long, keyword: String): String {
            return getHexString("$long1:$keyword")
        }
        @Throws(NoSuchAlgorithmException::class)
        private fun getHexString(source: String): String {
            val digest = MessageDigest
                .getInstance(DEFAULT_DIGEST_ALGORITHM)
                .digest(source.toByteArray())

            return Hex.encodeHexString(digest)
        }
    }
}
