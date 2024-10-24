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
        const collection = database.collection('kanji')

        let query = {}
        let projection = {}

        if (id !== null) {
            
            query = { 'id': parseInt(id) }
            projection = { 'data': 1 } // Empty projection to return all fields
        } else if (levels !== null) {
            const levelNum = parseInt(levels)
            const minLevel = levelNum * 10 + 1
            const maxLevel = (levelNum + 1) * 10
            query = { 'data.level': { $gte: minLevel, $lte: maxLevel } }
            projection = {
                'id': 1,
                'data.level': 1,
                'data.lesson_position': 1,
                'data.meanings': 1,
                'data.characters': 1
            }
        }  else if (level !== null) {
            query = { 'data.level': parseInt(level) }
            projection = {
                'id': 1,
                'data.level': 1,
                'data.lesson_position': 1,
                'data.meanings': 1,
                'data.characters': 1
            }
        } else {
            query = { 'data.level': { $gte: 1, $lte: 10 } }
            projection = {
                'id': 1,
                'data.level': 1,
                'data.lesson_position': 1,
                'data.meanings': 1,
                'data.characters': 1
            }
        }

        const kanji = await collection.find(query).project(projection).toArray()


        let result
        if (id !== null) {
            result = kanji.length > 0 ? kanji[0].data : null
        } else {
            result = kanji.map(k => ({
                id: k.id,
                level: k.data.level,
                lesson_position: k.data.lesson_position,
                characters: k.data.characters,
                primary_meaning: k.data.meanings.find((m: any) => m.primary)?.meaning || ''
            }))
        }

        return new Response(JSON.stringify(result), {
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