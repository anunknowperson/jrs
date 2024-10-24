import { type NextRequest } from 'next/server'
import clientPromise from '../../../util/mongodb'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const levels = searchParams.get('levels')
    const level = searchParams.get('level')
    const id = searchParams.get('id')

    try {
        const client = await clientPromise
        const database = client.db('japanese')
        const vocabularyCollection = database.collection('vocabulary')
        const kanaVocabularyCollection = database.collection('kana_vocabulary')

        if (id !== null) {
            // If 'id' is provided, search in both collections
            const word = await vocabularyCollection.findOne({ 'id': parseInt(id) }) ||
                         await kanaVocabularyCollection.findOne({ 'id': parseInt(id) })

            if (word) {
                return new Response(JSON.stringify(word.data), {
                    headers: { 'Content-Type': 'application/json' },
                })
            } else {
                return new Response(JSON.stringify({ error: 'Word not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                })
            }
        } else {
            // Existing logic for 'levels' query
            let query = {}
            if (levels !== null) {
                const levelNum = parseInt(levels)
                const minLevel = levelNum * 10 + 1
                const maxLevel = (levelNum + 1) * 10
                query = { 'data.level': { $gte: minLevel, $lte: maxLevel } }
            } else if (level !== null) {
                query = { 'data.level': parseInt(level) }
            } else {
                query = { 'data.level': { $gte: 1, $lte: 10 } }
            }

            const projection = {
                'id': 1,
                'data.level': 1,
                'data.lesson_position': 1,
                'data.meanings': 1,
                'data.characters': 1,
                'data.readings': 1
            }

            

            const vocabularyWords = await vocabularyCollection.find(query).project(projection).toArray()
            const kanaVocabularyWords = await kanaVocabularyCollection.find(query).project(projection).toArray()

            const allWords = [...vocabularyWords, ...kanaVocabularyWords]
            
            const simplifiedWords = allWords.map(k => ({
                id: k.id,
                level: k.data.level,
                lesson_position: k.data.lesson_position,
                characters: k.data.characters,
                primary_meaning: k.data.meanings.find((m: any) => m.primary)?.meaning || '',
                primary_reading: k.data.readings 
                    ? k.data.readings.find((m: any) => m.primary)?.reading || ''
                    : k.data.characters
            }))
            
            return new Response(JSON.stringify(simplifiedWords), {
                headers: { 'Content-Type': 'application/json' },
            })
        }
    } catch (error) {
        console.error('Error:', error)
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}