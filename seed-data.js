import { upsertNode, ensureInitialized } from './src/lib/db.js'
import { nanoid } from 'nanoid'
import sqlite3 from 'sqlite3'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data.db')

function getDb() {
  return new sqlite3.Database(DB_PATH)
}

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve(this)
    })
  })
}

function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

const teachers = [
  {
    name: "Buddha (Siddhartha Gautama)",
    country: "NP",
    tradition: "Buddhism",
    description: "The founder of Buddhism, known as the Enlightened One",
    bio: "Born as Prince Siddhartha Gautama in Lumbini, Nepal around 563 BCE. After witnessing suffering in the world, he renounced his royal life to seek enlightenment. After years of meditation and spiritual practice, he achieved enlightenment under a Bodhi tree and became known as the Buddha. He spent the rest of his life teaching the Four Noble Truths and the Eightfold Path.",
    photo_url: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Gandhara_Buddha_%28tnm%29.jpeg"
  },
  {
    name: "Dalai Lama (Tenzin Gyatso)",
    country: "CN",
    tradition: "Tibetan Buddhism",
    description: "14th Dalai Lama and spiritual leader of Tibet",
    bio: "Born in 1935 in Tibet, recognized as the reincarnation of the 13th Dalai Lama. Has dedicated his life to promoting compassion, peace, and the preservation of Tibetan culture. Nobel Peace Prize winner in 1989.",
    photo_url: "https://upload.wikimedia.org/wikipedia/commons/5/55/Dalai_Lama_1430_Luca_Galuzzi_2007crop.jpg"
  },
  {
    name: "Thich Nhat Hanh",
    country: "VN",
    tradition: "Zen Buddhism",
    description: "Vietnamese Zen master and peace activist",
    bio: "Vietnamese Zen Buddhist monk, peace activist, and founder of the Plum Village Tradition. Known for his teachings on mindfulness and his efforts to bring Buddhism to the West. Author of over 100 books.",
    photo_url: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Thich_Nhat_Hanh_12_%28cropped%29.jpg"
  },
  {
    name: "Ajahn Chah",
    country: "TH",
    tradition: "Theravada Buddhism",
    description: "Thai Forest Tradition master and meditation teacher",
    bio: "Influential Thai Buddhist monk of the Thai Forest Tradition. Known for his simple, direct teaching style and his ability to convey complex Buddhist concepts through everyday analogies. Founded over 300 monasteries worldwide.",
    photo_url: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Ajahn_Chah.jpg"
  },
  {
    name: "Pema Chödrön",
    country: "US",
    tradition: "Tibetan Buddhism",
    description: "American Buddhist nun and author",
    bio: "American-born Tibetan Buddhist. Resident teacher at Gampo Abbey in Nova Scotia. Known for her accessible teachings on meditation, compassion, and dealing with difficult emotions. Author of many popular books including 'When Things Fall Apart'.",
    photo_url: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Pema_Ch%C3%B6dr%C3%B6n_2017.jpg"
  },
  {
    name: "Suzuki Roshi",
    country: "JP",
    tradition: "Zen Buddhism",
    description: "Japanese Zen master who brought Zen to America",
    bio: "Shunryu Suzuki was a Sōtō Zen monk and teacher who helped popularize Zen Buddhism in the United States. Founded the San Francisco Zen Center and author of 'Zen Mind, Beginner's Mind'.",
    photo_url: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Suzuki-roshi.jpg"
  },
  {
    name: "Adyashanti",
    country: "US",
    tradition: "Non-dual Spirituality",
    description: "American spiritual teacher focused on awakening",
    bio: "Born Steven Gray, American spiritual teacher devoted to serving the awakening of all beings. His teachings are an open invitation to stop, inquire, and recognize what is true and liberating at the core of all existence.",
    photo_url: "https://example.com/adyashanti.jpg"
  },
  {
    name: "Ram Dass",
    country: "US",
    tradition: "Hindu-Buddhist",
    description: "Spiritual teacher and author of 'Be Here Now'",
    bio: "Born Richard Alpert, was an American spiritual teacher, guru of modern yoga, psychologist, and author. Known for his personal and professional association with Timothy Leary and for his book 'Be Here Now'.",
    photo_url: "https://upload.wikimedia.org/wikipedia/commons/c/c4/Ram_Dass_2012.jpg"
  },
  {
    name: "Eckhart Tolle",
    country: "DE",
    tradition: "Non-dual Spirituality",
    description: "German spiritual teacher and author",
    bio: "Born Ulrich Leonard Tölle, is a German-born spiritual teacher. Best known for his books 'The Power of Now' and 'A New Earth: Awakening to Your Life's Purpose'.",
    photo_url: "https://upload.wikimedia.org/wikipedia/commons/7/78/Eckhart_Tolle_2008.jpg"
  },
  {
    name: "Krishnamurti",
    country: "IN",
    tradition: "Independent Spirituality",
    description: "Indian philosopher and spiritual teacher",
    bio: "Jiddu Krishnamurti was an Indian philosopher, speaker and writer. In his early life he was groomed to be the new World Teacher but later rejected this mantle and spent the rest of his life speaking and writing about the need for a radical change in mankind.",
    photo_url: "https://upload.wikimedia.org/wikipedia/commons/c/c6/Jiddu_Krishnamurti_01.jpg"
  },
  {
    name: "Mooji",
    country: "JM",
    tradition: "Advaita Vedanta",
    description: "Jamaican spiritual teacher in the Advaita tradition",
    bio: "Born Anthony Paul Moo-Young, is a Jamaican spiritual teacher based in Portugal and India. A disciple of Sri Harilal Poonja (Papaji), he teaches in the tradition of Advaita Vedanta.",
    photo_url: "https://example.com/mooji.jpg"
  },
  {
    name: "Sadhguru",
    country: "IN",
    tradition: "Yoga",
    description: "Indian yogi, mystic and spiritual teacher",
    bio: "Jaggi Vasudev, known publicly as Sadhguru, is an Indian yogi, mystic, philanthropist and author. He founded the Isha Foundation, a non-profit organization which offers Yoga programs around the world.",
    photo_url: "https://upload.wikimedia.org/wikipedia/commons/8/86/Sadhguru_Jaggi_Vasudev.jpg"
  },
  {
    name: "Mata Amritanandamayi",
    country: "IN",
    tradition: "Hinduism",
    description: "Hindu spiritual leader known as the 'Hugging Saint'",
    bio: "Known throughout the world as Amma, or Mother, for her selfless love and compassion toward all beings. She is known for hugging people, and is said to have hugged more than 37 million people throughout her lifetime.",
    photo_url: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Amma_%28Mata_Amritanandamayi%29_2012.jpg"
  },
  {
    name: "Rupert Spira",
    country: "GB",
    tradition: "Non-dual Awareness",
    description: "British spiritual teacher and potter",
    bio: "Rupert Spira is a teacher of the 'direct path' to the recognition of the essential nature of awareness or consciousness. For many years a student of the classical Advaita Vedanta teacher Francis Lucille.",
    photo_url: "https://example.com/rupert-spira.jpg"
  },
  {
    name: "Jack Kornfield",
    country: "US",
    tradition: "Vipassana Buddhism",
    description: "American Buddhist teacher and psychologist",
    bio: "Co-founder of the Insight Meditation Society in Barre, Massachusetts, with fellow meditation teachers Joseph Goldstein and Sharon Salzberg. Author of several books including 'A Path with Heart'.",
    photo_url: "https://example.com/jack-kornfield.jpg"
  },
  {
    name: "Sharon Salzberg",
    country: "US",
    tradition: "Vipassana Buddhism",
    description: "American meditation teacher and author",
    bio: "Co-founder of the Insight Meditation Society in Barre, Massachusetts. Has been leading meditation retreats worldwide since 1974. Author of several books including 'Lovingkindness: The Revolutionary Art of Happiness'.",
    photo_url: "https://example.com/sharon-salzberg.jpg"
  },
  {
    name: "Mingyur Rinpoche",
    country: "NP",
    tradition: "Tibetan Buddhism",
    description: "Tibetan meditation master and author",
    bio: "Yongey Mingyur Rinpoche is a Tibetan teacher and master of the Karma Kagyu and Nyingma lineages of Tibetan Buddhism. Author of several books including 'The Joy of Living' and 'Joyful Wisdom'.",
    photo_url: "https://example.com/mingyur-rinpoche.jpg"
  },
  {
    name: "Ajahn Sumedho",
    country: "US",
    tradition: "Theravada Buddhism",
    description: "American-born Buddhist monk in the Thai Forest tradition",
    bio: "Robert Kan Jackman, better known as Ajahn Sumedho, is an American-born Buddhist monk. He was instrumental in establishing Theravada Buddhism in the United Kingdom and other Western countries.",
    photo_url: "https://example.com/ajahn-sumedho.jpg"
  }
]

const monasteries = [
  {
    name: "Bodhgaya",
    country: "IN",
    tradition: "Buddhism",
    description: "Sacred site where Buddha attained enlightenment",
    bio: "Located in Bihar, India, this is the most sacred site in Buddhism where Prince Siddhartha attained enlightenment under the Bodhi tree and became the Buddha. The Mahabodhi Temple complex is a UNESCO World Heritage Site."
  },
  {
    name: "Wat Phra That Doi Suthep",
    country: "TH",
    tradition: "Theravada Buddhism",
    description: "Sacred Buddhist temple in Chiang Mai",
    bio: "Located on Doi Suthep mountain overlooking Chiang Mai, Thailand. Founded in 1383, it houses a relic of the Buddha. The temple is reached by climbing 309 steps flanked by naga (serpent) balustrades."
  },
  {
    name: "Potala Palace",
    country: "CN",
    tradition: "Tibetan Buddhism",
    description: "Former residence of the Dalai Lama in Lhasa, Tibet",
    bio: "A dzong fortress in Lhasa, Tibet. It was the winter palace of the Dalai Lamas from 1649 to 1959, has been a museum since then, and is a World Heritage Site since 1994."
  },
  {
    name: "Plum Village",
    country: "FR",
    tradition: "Zen Buddhism",
    description: "International meditation center founded by Thich Nhat Hanh",
    bio: "Located in southwestern France, Plum Village is the largest Buddhist monastery in Europe. Founded by Thich Nhat Hanh in 1982, it's a place where people come to practice mindful living."
  },
  {
    name: "Tassajara Zen Mountain Center",
    country: "US",
    tradition: "Zen Buddhism",
    description: "First Zen monastery established outside Asia",
    bio: "Located in California's Ventana Wilderness, it was the first Zen monastery established outside Asia. Founded by the San Francisco Zen Center, it offers intensive meditation practice in a natural setting."
  },
  {
    name: "Wat Pah Pong",
    country: "TH",
    tradition: "Theravada Buddhism",
    description: "Forest monastery founded by Ajahn Chah",
    bio: "Located in northeast Thailand, this monastery was founded by Ajahn Chah in 1954. It follows the Thai Forest Tradition and emphasizes meditation practice in natural forest settings."
  },
  {
    name: "Gampo Abbey",
    country: "CA",
    tradition: "Tibetan Buddhism",
    description: "Tibetan Buddhist monastery in Nova Scotia",
    bio: "Founded in 1984, Gampo Abbey is a Tibetan Buddhist monastery for Western monks and nuns in the Shambhala tradition, located on Cape Breton Island, Nova Scotia."
  },
  {
    name: "Amaravati Buddhist Monastery",
    country: "GB",
    tradition: "Theravada Buddhism",
    description: "Theravada monastery in England",
    bio: "Located in Hertfordshire, England, Amaravati is the main monastery of the English Sangha Trust. It follows the Thai Forest tradition and was established by Ajahn Sumedho."
  },
  {
    name: "Dzogchen Monastery",
    country: "IN",
    tradition: "Tibetan Buddhism",
    description: "Important Nyingma monastery in India",
    bio: "One of the most important monasteries of the Nyingma school of Tibetan Buddhism. Located in Kollegal, Karnataka, India, it was re-established after the original monastery in Tibet."
  },
  {
    name: "Kopan Monastery",
    country: "NP",
    tradition: "Tibetan Buddhism",
    description: "Tibetan Buddhist monastery near Kathmandu",
    bio: "Located on the outskirts of Kathmandu, Nepal. Founded by Lama Thubten Yeshe and Lama Zopa Rinpoche, it's known for offering courses on Buddhism to Western students."
  },
  {
    name: "Abhayagiri Monastery",
    country: "US",
    tradition: "Theravada Buddhism",
    description: "Theravada forest monastery in California",
    bio: "Located in Redwood Valley, California, this monastery follows the Thai Forest Tradition. Founded by Ajahn Amaro and other Western disciples of Ajahn Chah."
  },
  {
    name: "Isha Yoga Center",
    country: "IN",
    tradition: "Yoga",
    description: "Spiritual center founded by Sadhguru",
    bio: "Located at the foothills of the Velliangiri Mountains in Tamil Nadu, India. Founded by Sadhguru, it serves as the headquarters of the Isha Foundation."
  },
  {
    name: "Ramana Ashram",
    country: "IN",
    tradition: "Advaita Vedanta",
    description: "Ashram dedicated to Sri Ramana Maharshi",
    bio: "Located in Tiruvannamalai, Tamil Nadu, at the base of the sacred hill Arunachala. This is where Sri Ramana Maharshi lived and taught until his death in 1950."
  },
  {
    name: "Osho International Meditation Resort",
    country: "IN",
    tradition: "Rajneesh Movement",
    description: "Meditation resort in Pune, India",
    bio: "Located in Pune, India, this resort was founded by Osho (Bhagwan Shree Rajneesh). It offers various meditation techniques and spiritual programs."
  }
]

const events = [
  {
    name: "Vesak Day Celebration",
    country: "LK",
    tradition: "Buddhism",
    description: "Buddhist festival celebrating Buddha's birth, enlightenment, and death",
    bio: "Vesak Day is the most important Buddhist festival. It celebrates three significant events in Buddha's life: his birth, enlightenment, and death. Celebrated with lanterns, decorations, and acts of compassion."
  },
  {
    name: "Mindfulness Retreat at Plum Village",
    country: "FR",
    tradition: "Zen Buddhism",
    description: "Week-long mindfulness retreat in France",
    bio: "A transformative retreat at Plum Village offering daily meditation, dharma talks, walking meditation in nature, and opportunities for deep rest and reflection in the tradition of Thich Nhat Hanh."
  },
  {
    name: "Vipassana Meditation Course",
    country: "IN",
    tradition: "Vipassana",
    description: "10-day silent meditation retreat teaching Vipassana technique",
    bio: "Intensive 10-day course teaching Vipassana meditation as taught by S.N. Goenka. Students observe noble silence and learn to observe sensations in the body with equanimity."
  },
  {
    name: "Kalachakra Initiation",
    country: "IN",
    tradition: "Tibetan Buddhism",
    description: "Sacred tantric empowerment ceremony led by the Dalai Lama",
    bio: "The Kalachakra initiation is one of the most complex and profound teachings in Tibetan Buddhism. This rare ceremony is only given by the highest lamas and attracts thousands of practitioners worldwide."
  },
  {
    name: "Rainbow Body Teachings",
    country: "US",
    tradition: "Dzogchen",
    description: "Advanced Dzogchen teachings on the rainbow body",
    bio: "Rare teachings on the advanced Dzogchen practice of achieving the rainbow body - the ultimate realization where the physical body dissolves into pure light at the time of death."
  },
  {
    name: "Zen Sesshin Retreat",
    country: "JP",
    tradition: "Zen Buddhism",
    description: "Traditional intensive Zen meditation retreat",
    bio: "A traditional Japanese Zen retreat featuring long periods of zazen (sitting meditation), kinhin (walking meditation), teisho (dharma talks), and dokusan (private interviews with the teacher)."
  },
  {
    name: "Non-Dual Awareness Workshop",
    country: "GB",
    tradition: "Non-dual Spirituality",
    description: "Weekend workshop on recognizing non-dual awareness",
    bio: "Intensive weekend exploring the direct recognition of awareness itself. Combining guided meditations, contemplative exercises, and dialogues to point directly to our essential nature."
  },
  {
    name: "Sufi Whirling Ceremony",
    country: "TR",
    tradition: "Sufism",
    description: "Sacred whirling ceremony of the Mevlevi order",
    bio: "Traditional sema ceremony of the Whirling Dervishes, a form of physically active meditation practiced by Sufi Muslims. The ceremony represents a mystical journey of spiritual ascent."
  },
  {
    name: "Medicine Buddha Empowerment",
    country: "NP",
    tradition: "Tibetan Buddhism",
    description: "Healing empowerment focusing on the Medicine Buddha",
    bio: "Sacred initiation into the practice of Medicine Buddha, focusing on healing and purification. Includes teachings on using visualization and mantra for physical and spiritual healing."
  },
  {
    name: "Silent Retreat with Adyashanti",
    country: "US",
    tradition: "Non-dual Spirituality",
    description: "Silent retreat exploring awakening and liberation",
    bio: "Five-day silent retreat with Adyashanti focusing on the direct recognition of truth and the end of psychological suffering. Includes periods of silence, meditation, and dharma talks."
  },
  {
    name: "Kirtan Festival",
    country: "IN",
    tradition: "Bhakti Yoga",
    description: "Devotional music festival featuring kirtan and bhajans",
    bio: "Multi-day festival celebrating devotional music and chanting. Features renowned kirtan artists leading group chanting sessions designed to open the heart and induce states of devotion and bliss."
  },
  {
    name: "Forest Monastery Ordination",
    country: "TH",
    tradition: "Theravada Buddhism",
    description: "Traditional monk ordination ceremony in the Thai Forest tradition",
    bio: "Sacred ceremony where candidates take full monastic vows in the Thai Forest tradition. Includes traditional rituals, community blessings, and commitment to intensive meditation practice."
  },
  {
    name: "Yoga and Meditation Immersion",
    country: "IN",
    tradition: "Yoga",
    description: "Intensive yoga and meditation training program",
    bio: "Month-long immersive program combining traditional hatha yoga, pranayama, meditation, and philosophical study. Designed for serious practitioners seeking deep transformation."
  },
  {
    name: "Dzogchen Pointing-Out Instructions",
    country: "US",
    tradition: "Dzogchen",
    description: "Direct introduction to the nature of mind",
    bio: "Rare opportunity to receive pointing-out instructions - the direct introduction to rigpa, the nature of mind. This is the heart of Dzogchen practice and is only given by qualified masters."
  }
]

// Generate random teachers
function generateRandomTeachers(count = 100) {
  const firstNames = [
    'Aiden', 'Aria', 'Bodhi', 'Cora', 'Davi', 'Eva', 'Felix', 'Grace', 'Hugo', 'Iris',
    'Jaya', 'Kai', 'Luna', 'Maya', 'Noah', 'Ora', 'Phoenix', 'Quinn', 'River', 'Sage',
    'Tara', 'Uma', 'Vera', 'Wren', 'Xara', 'Yuki', 'Zara', 'Amit', 'Bani', 'Chandra',
    'Deepak', 'Eesha', 'Govind', 'Hansa', 'Indira', 'Jivan', 'Kamala', 'Lakshmi', 'Mira', 'Nanda',
    'Omkari', 'Priya', 'Radha', 'Sita', 'Tanu', 'Usha', 'Vidya', 'Yasmin', 'Akira', 'Benjiro',
    'Chiyo', 'Daichi', 'Emiko', 'Fumio', 'Goro', 'Hana', 'Ichiro', 'Jiro', 'Kenji', 'Mei',
    'Naoki', 'Osamu', 'Ren', 'Saki', 'Takeshi', 'Yuki', 'Ananda', 'Bhavani', 'Chetan', 'Dharma',
    'Eka', 'Gyan', 'Hari', 'Ishwar', 'Jnana', 'Kiran', 'Lila', 'Mukti', 'Nirvana', 'Om',
    'Param', 'Rishi', 'Satya', 'Tattva', 'Urja', 'Veda', 'Yoga', 'Zen', 'Ashwin', 'Bhanu'
  ]
  
  const lastNames = [
    'Singh', 'Sharma', 'Patel', 'Kumar', 'Das', 'Gupta', 'Tanaka', 'Sato', 'Suzuki', 'Takahashi',
    'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Yamazaki',
    'Chen', 'Wang', 'Li', 'Zhang', 'Liu', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou',
    'Thapa', 'Shrestha', 'Maharjan', 'Magar', 'Tamang', 'Gurung', 'Rai', 'Limbu', 'Sherpa', 'Bhattarai',
    'Rinpoche', 'Lama', 'Roshi', 'Sensei', 'Acharya', 'Swami', 'Guru', 'Pandit', 'Muni', 'Yogi',
    'Stone', 'River', 'Mountain', 'Forest', 'Ocean', 'Sky', 'Star', 'Moon', 'Sun', 'Wind',
    'Peace', 'Light', 'Wisdom', 'Truth', 'Love', 'Joy', 'Bliss', 'Serenity', 'Harmony', 'Unity',
    'Walker', 'Seeker', 'Finder', 'Dreamer', 'Watcher', 'Listener', 'Healer', 'Teacher', 'Guide', 'Path'
  ]
  
  const traditions = [
    'Zen Buddhism', 'Tibetan Buddhism', 'Theravada Buddhism', 'Vipassana', 'Dzogchen',
    'Advaita Vedanta', 'Bhakti Yoga', 'Karma Yoga', 'Raja Yoga', 'Hatha Yoga',
    'Non-dual Spirituality', 'Mindfulness', 'Sufism', 'Christian Mysticism', 'Jewish Mysticism',
    'Taoism', 'Shamanism', 'Neo-Vedanta', 'Integral Spirituality', 'Eco-spirituality'
  ]
  
  const countries = ['US', 'IN', 'CN', 'JP', 'TH', 'NP', 'TW', 'KR', 'GB', 'FR', 'DE', 'CA', 'AU', 'BR', 'MX']
  
  const descriptions = [
    'Modern spiritual teacher focused on awakening consciousness',
    'Meditation master teaching ancient wisdom for contemporary life',
    'Contemplative teacher bridging Eastern and Western traditions',
    'Mindfulness instructor specializing in stress reduction and healing',
    'Dharma teacher emphasizing compassion and loving-kindness',
    'Wisdom teacher exploring the nature of reality and consciousness',
    'Spiritual guide helping others discover their true nature',
    'Teacher of non-dual awareness and self-inquiry',
    'Meditation teacher focusing on inner transformation',
    'Contemporary mystic sharing timeless spiritual truths',
    'Teacher of mindful living and conscious awareness',
    'Spiritual mentor guiding students toward liberation',
    'Wisdom keeper transmitting ancient teachings',
    'Teacher of presence and awakened awareness',
    'Guide for those seeking spiritual understanding',
    'Teacher of contemplative practices and inner peace',
    'Spiritual educator focusing on heart-centered wisdom',
    'Teacher of meditation and conscious living',
    'Guide for spiritual seekers and practitioners',
    'Teacher of awareness and mindful transformation'
  ]
  
  const randomTeachers = []
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const tradition = traditions[Math.floor(Math.random() * traditions.length)]
    const country = countries[Math.floor(Math.random() * countries.length)]
    const description = descriptions[Math.floor(Math.random() * descriptions.length)]
    
    randomTeachers.push({
      name: `${firstName} ${lastName}`,
      country,
      tradition,
      description,
      bio: `${firstName} ${lastName} is a dedicated practitioner of ${tradition} with over ${Math.floor(Math.random() * 30) + 5} years of experience. Known for their ${['compassionate', 'insightful', 'profound', 'gentle', 'powerful', 'transformative', 'wise', 'inspiring'][Math.floor(Math.random() * 8)]} teaching style and deep understanding of spiritual principles.`,
      photo_url: `https://i.pravatar.cc/200?u=${firstName}${lastName}${i}`
    })
  }
  
  return randomTeachers
}

async function seedData() {
  console.log('Initializing database...')
  await ensureInitialized()
  
  const db = getDb()
  
  console.log('Seeding famous teachers...')
  for (const teacher of teachers) {
    const node = {
      type: 'teacher',
      name: teacher.name,
      country: teacher.country,
      tradition: teacher.tradition,
      description: teacher.description,
      bio: teacher.bio,
      photo_url: teacher.photo_url
    }
    await upsertNode(node)
    console.log(`Added teacher: ${teacher.name}`)
  }
  
  console.log('Generating and seeding 100 random teachers...')
  const randomTeachers = generateRandomTeachers(100)
  for (const teacher of randomTeachers) {
    const node = {
      type: 'teacher',
      name: teacher.name,
      country: teacher.country,
      tradition: teacher.tradition,
      description: teacher.description,
      bio: teacher.bio,
      photo_url: teacher.photo_url
    }
    await upsertNode(node)
    console.log(`Added random teacher: ${teacher.name}`)
  }
  
  console.log('Seeding monasteries...')
  for (const monastery of monasteries) {
    const node = {
      type: 'monastery',
      name: monastery.name,
      country: monastery.country,
      tradition: monastery.tradition,
      description: monastery.description,
      bio: monastery.bio || '',
      photo_url: ''
    }
    await upsertNode(node)
    console.log(`Added monastery: ${monastery.name}`)
  }
  
  console.log('Seeding events...')
  for (const event of events) {
    const node = {
      type: 'event',
      name: event.name,
      country: event.country,
      tradition: event.tradition,
      description: event.description,
      bio: event.bio || '',
      photo_url: ''
    }
    await upsertNode(node)
    console.log(`Added event: ${event.name}`)
  }
  
  // Create some relationships
  console.log('Creating relationships...')
  
  // Get all teachers and monasteries to create some relationships
  const teacherRows = await dbAll(db, `SELECT id, name FROM nodes WHERE type = 'teacher'`)
  const monasteryRows = await dbAll(db, `SELECT id, name FROM nodes WHERE type = 'monastery'`)
  
  const relationships = [
    // Buddha relationships
    { teacher: 'Buddha (Siddhartha Gautama)', monastery: 'Bodhgaya', relation: 'achieved_enlightenment_at' },
    
    // Dalai Lama relationships  
    { teacher: 'Dalai Lama (Tenzin Gyatso)', monastery: 'Potala Palace', relation: 'resided_at' },
    
    // Thich Nhat Hanh relationships
    { teacher: 'Thich Nhat Hanh', monastery: 'Plum Village', relation: 'founded' },
    
    // Ajahn Chah relationships
    { teacher: 'Ajahn Chah', monastery: 'Wat Pah Pong', relation: 'founded' },
    
    // Pema Chödrön relationships
    { teacher: 'Pema Chödrön', monastery: 'Gampo Abbey', relation: 'teaches_at' },
    
    // Ajahn Sumedho relationships
    { teacher: 'Ajahn Sumedho', monastery: 'Amaravati Buddhist Monastery', relation: 'founded' },
    
    // Sadhguru relationships
    { teacher: 'Sadhguru', monastery: 'Isha Yoga Center', relation: 'founded' }
  ]
  
  for (const rel of relationships) {
    const teacher = teacherRows.find(t => t.name === rel.teacher)
    const monastery = monasteryRows.find(m => m.name === rel.monastery)
    
    if (teacher && monastery) {
      await dbRun(db, 'INSERT OR IGNORE INTO edges (id, from_id, to_id, relation) VALUES (?,?,?,?)', 
        [nanoid(), teacher.id, monastery.id, rel.relation])
      console.log(`Created relationship: ${teacher.name} ${rel.relation} ${monastery.name}`)
    }
  }
  
  // Generate random teacher-student relationships
  console.log('Creating random teacher-student relationships...')
  await generateRandomTeacherRelationships(db, teacherRows)

  console.log('Data seeding complete!')
  db.close()
}


async function generateRandomTeacherRelationships(db, teacherRows) {
  const relationships = []
  
  // Helper function to get random teachers
  function getRandomTeachers(excludeId, count) {
    const available = teacherRows.filter(t => t.id !== excludeId)
    const shuffled = [...available].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }
  
  // For each teacher, randomly assign them some relationships
  for (const teacher of teacherRows) {
    const connectionCount = Math.floor(Math.random() * 4) + 1 // 1-4 connections each
    
    for (let i = 0; i < connectionCount; i++) {
      const relationshipType = Math.random()
      
      if (relationshipType < 0.6) {
        // 60% chance: This teacher teaches someone (teacher -> student)
        const students = getRandomTeachers(teacher.id, 1)
        if (students.length > 0) {
          relationships.push({
            from_id: teacher.id,
            to_id: students[0].id,
            relation: 'teacher_of',
            fromName: teacher.name,
            toName: students[0].name
          })
        }
      } else {
        // 40% chance: This teacher was taught by someone (student <- teacher)  
        const teachers = getRandomTeachers(teacher.id, 1)
        if (teachers.length > 0) {
          relationships.push({
            from_id: teachers[0].id,
            to_id: teacher.id,
            relation: 'teacher_of',
            fromName: teachers[0].name,
            toName: teacher.name
          })
        }
      }
    }
  }
  
  // Remove duplicates and create some special lineage chains
  const uniqueRelationships = []
  const relationshipSet = new Set()
  
  for (const rel of relationships) {
    const key = `${rel.from_id}-${rel.to_id}-${rel.relation}`
    const reverseKey = `${rel.to_id}-${rel.from_id}-${rel.relation}`
    
    if (!relationshipSet.has(key) && !relationshipSet.has(reverseKey)) {
      relationshipSet.add(key)
      uniqueRelationships.push(rel)
    }
  }
  
  // Create some famous lineage chains manually for better structure
  const famousLineages = [
    // Buddhist lineage
    ['Buddha (Siddhartha Gautama)', 'Dalai Lama (Tenzin Gyatso)', 'Mingyur Rinpoche'],
    ['Buddha (Siddhartha Gautama)', 'Thich Nhat Hanh', 'Jack Kornfield'],
    ['Ajahn Chah', 'Ajahn Sumedho', 'Pema Chödrön'],
    
    // Non-dual lineage  
    ['Krishnamurti', 'Eckhart Tolle', 'Adyashanti'],
    ['Ram Dass', 'Rupert Spira', 'Mooji'],
    
    // Meditation lineage
    ['Suzuki Roshi', 'Jack Kornfield', 'Sharon Salzberg']
  ]
  
  for (const lineage of famousLineages) {
    for (let i = 0; i < lineage.length - 1; i++) {
      const teacher = teacherRows.find(t => t.name === lineage[i])
      const student = teacherRows.find(t => t.name === lineage[i + 1])
      
      if (teacher && student) {
        const key = `${teacher.id}-${student.id}-teacher_of`
        if (!relationshipSet.has(key)) {
          uniqueRelationships.push({
            from_id: teacher.id,
            to_id: student.id,
            relation: 'teacher_of',
            fromName: teacher.name,
            toName: student.name
          })
          relationshipSet.add(key)
        }
      }
    }
  }
  
  // Insert relationships into database
  for (const rel of uniqueRelationships) {
    try {
      await dbRun(db, 'INSERT OR IGNORE INTO edges (id, from_id, to_id, relation) VALUES (?,?,?,?)', 
        [nanoid(), rel.from_id, rel.to_id, rel.relation])
      console.log(`Created relationship: ${rel.fromName} teaches ${rel.toName}`)
    } catch (error) {
      console.log(`Skipped duplicate: ${rel.fromName} -> ${rel.toName}`)
    }
  }
  
  console.log(`Created ${uniqueRelationships.length} teacher-student relationships`)
}

seedData().catch(console.error)