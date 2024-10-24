import { type NextRequest } from 'next/server'
import clientPromise from '../../../util/mongodb'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')

    if (!query) {
        return new Response(JSON.stringify({ error: 'Query parameter is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    try {
        const client = await clientPromise
        const database = client.db('japanese')
        
        const collections = ['kanji', 'vocabulary', 'kana_vocabulary', 'radical']
        const results = []

        for (const collectionName of collections) {
            const collection = database.collection(collectionName)
            
            const documents = await collection.find({
                $or: [
                    { "data.characters": query },
                    { "data.meanings.meaning": { $regex: query, $options: 'i' } },
                    { "data.readings.reading": { $regex: query, $options: 'i' } },
                    { "data.slug": { $regex: query, $options: 'i' } }
                ]
            }).toArray()

            for (const doc of documents) {
                let type = collectionName
                if (type === 'kana_vocabulary') {
                    type = 'vocabulary'
                }
                results.push({
                    type: type,
                    id: doc.id
                })
            }
        }

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Error:', error)
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}