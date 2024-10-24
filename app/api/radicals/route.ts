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
        const collection = database.collection('radical')

        let query = {}
        let projection :any = {
            'id': 1,
            'data.characters': 1,
            'data.character_images': 1,
            'data.level': 1,
            'data.meanings': 1,
            'data.lesson_position': 1
        }

        if (id !== null) {
            // If id is specified, retrieve the specific radical
            query = { 'id': parseInt(id) }
            projection = { 'data': 1 } // Return all data for the specific radical
        } else if (levels !== null) {
            const levelNum = parseInt(levels)
            const minLevel = levelNum * 10 + 1
            const maxLevel = (levelNum + 1) * 10
            query = { 'data.level': { $gte: minLevel, $lte: maxLevel } }
        } else if (level !== null) {
            query = { 'data.level': parseInt(level) }
        } else {
            query = { 'data.level': { $gte: 1, $lte: 10 } }
        }

        const radicals = await collection.find(query).project(projection).toArray()

        let result
        if (id !== null) {
            // If id was specified, return the full data of the single radical
            result = radicals.length > 0 ? radicals[0].data : null
        } else {
            // Otherwise, return the simplified array of radicals
            result = radicals.map(radical => ({
                id: radical.id,
                characters: radical.data.characters,
                character_images: radical.data.character_images,
                level: radical.data.level,
                meanings: radical.data.meanings,
                lesson_position: radical.data.lesson_position
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