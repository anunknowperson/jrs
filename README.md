```markdown
# JRS - Japanese Repetition System

A web application for learning Japanese through mnemonic techniques.

Important: you need to create or bring your own data to learn.

## Table of Contents

- [Description](#description)
- [Guide](#guide)
- [User Documentation](#user-documentation)

## Description

JRS is built using the following technologies:  
- **Node.js** for the backend.  
- **Next.js** for the frontend.  
- **MongoDB** for data storage.  
- **Mantine** as the UI library.  

### Key Features:
- Learn kana, vocabulary, kanji, and radicals using mnemonics.
- Seamless level-based progression system.
- Comprehensive user statistics tracking.

## Guide

### How to Install and Run

#### Step 1: Prerequisites
- Install **pnpm** (recommended):  
  ```shell
  npm install -g pnpm
  ```

#### Step 2: Set Up the Repository
1. Clone the repository:
   ```shell
   git clone <repository_url>
   cd <repository_name>
   ```
2. Install dependencies using **pnpm**:
   ```shell
   pnpm install
   ```

#### Step 3: Configure Environment Variables
1. Create a `.env` file in the root directory.
2. Add the following variables:
   ```env
   NEXTAUTH_SECRET=<your_nextauth_secret>
   MONGODB_URL=<your_mongodb_url>
   ```

#### Step 4: Prepare the Database
Ensure your MongoDB instance contains a database named **Japanese** with the following collections:
- `kana_vocabulary`
- `vocabulary`
- `kanji`
- `radical`

Each document in the collections should follow this format:

```json
{
  "id": number,
  "data": {
    "level": number,
    "slug": string,
    "characters": string,
    "meanings": [
      {
        "meaning": string,
        "primary": bool,
        "accepted_answer": bool
      }
    ],
    "readings": [
      {
        "type": string,
        "primary": bool,
        "reading": string,
        "accepted_answer": bool
      }
    ],
    "component_subject_ids": [int],
    "amalgamation_subject_ids": [int],
    "visually_similar_subject_ids": [int],
    "meaning_mnemonic": string,
    "reading_mnemonic": string,
    "lesson_position": number
  }
}
```

#### Step 5: Run the Application for Development
```shell
pnpm run dev
```

#### Deployment
To deploy the application:
```shell
pnpm run build
pnpm run start
```

## User Documentation

### Project Structure
#### Directories
- `/app/dashboard/profile` - User profile page.
- `/app/dashboard/learn` - Learning new materials.
- `/app/dashboard/review` - Reviewing previously learned materials.
- `/app/dashboard/search` - Search functionality.
- `/app/dashboard/[kanji/radicals/words]` - Item detail pages.
- `/app/dashboard/levels/[level]` - Level-specific pages.

#### API Endpoints
- `/app/api/auth` - User authentication.
- `/app/api/lessons` - Fetching learning materials.
- `/app/api/stats` - User statistics.
- `/app/api/[kanji/radicals/words]` - API for specific items.
- `/app/api/search` - Search API.

#### Utilities
- `/util/mongodb.ts` - MongoDB connection setup.

#### Components
- `/components/[kanji/radicals/words]` - Components for specific items.
- `/components/HighlightedText.tsx` - Component for rendering colorful text.


## Contributing

We welcome contributions to JRS! Here’s how you can contribute:

1. **Fork the Repository**  
   Clone your fork locally and set up the project as described above.

2. **Make Your Changes**  
   Follow best practices for code style and include comments where necessary.

3. **Submit a Pull Request**  
   Ensure your PR includes a clear description of your changes and why they are needed.

For issues, feature requests, or general discussion, please open an issue in the repository.  
All contributions are appreciated!
```