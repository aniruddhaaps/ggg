import type { CareerProgress, CareerSave } from '../types/career'

const CAREER_SAVE_KEY = 'racing_game_career_save'

// Load all career saves from localStorage
export function loadCareerSaves(): CareerSave {
  try {
    console.log('[CAREER MANAGER DEBUG] Loading career saves from localStorage...')
    const saved = localStorage.getItem(CAREER_SAVE_KEY)
    console.log('[CAREER MANAGER DEBUG] Raw localStorage data:', saved)

    if (saved) {
      const data = JSON.parse(saved) as CareerSave
      console.log('[CAREER MANAGER DEBUG] Parsed data:', data)

      // Migrate old data to add totalCoins, btcBalance, and ownedCars if missing
      data.players = data.players.map(player => ({
        ...player,
        totalCoins: player.totalCoins ?? 0,
        btcBalance: player.btcBalance ?? 0,
        ownedCars: player.ownedCars ?? [1, 5] // Start with Car 1 and Car 5
      }))
      console.log('[CAREER MANAGER DEBUG] After migration:', data)
      return data
    }
  } catch (error) {
    console.error('[CAREER MANAGER DEBUG] Error loading career saves:', error)
  }
  console.log('[CAREER MANAGER DEBUG] No saved data, returning empty players array')
  return { players: [] }
}

// Save career data to localStorage
export function saveCareerData(careerSave: CareerSave): void {
  try {
    console.log('[CAREER MANAGER DEBUG] Saving career data to localStorage:', careerSave)
    localStorage.setItem(CAREER_SAVE_KEY, JSON.stringify(careerSave))
    console.log('[CAREER MANAGER DEBUG] Successfully saved to localStorage')

    // Verify it was saved correctly
    const verification = localStorage.getItem(CAREER_SAVE_KEY)
    console.log('[CAREER MANAGER DEBUG] Verification read:', verification)
  } catch (error) {
    console.error('[CAREER MANAGER DEBUG] Error saving career data:', error)
  }
}

// Find player by username
export function findPlayer(username: string): CareerProgress | null {
  const saves = loadCareerSaves()
  const player = saves.players.find(
    p => p.username.toLowerCase() === username.toLowerCase()
  )
  return player || null
}

// Create new player
export function createNewPlayer(username: string): CareerProgress {
  const newPlayer: CareerProgress = {
    username,
    currentLevel: 0, // Start at intro level
    completedLevels: [],
    timestamp: Date.now(),
    totalCoins: 0,
    btcBalance: 0,
    ownedCars: [1, 5], // Start with Car 1 and Car 5
  }

  const saves = loadCareerSaves()
  saves.players.push(newPlayer)
  saveCareerData(saves)

  return newPlayer
}

// Update player progress
export function updatePlayerProgress(
  username: string,
  currentLevel: number,
  completedLevels: number[]
): void {
  const saves = loadCareerSaves()
  const playerIndex = saves.players.findIndex(
    p => p.username.toLowerCase() === username.toLowerCase()
  )

  if (playerIndex !== -1) {
    saves.players[playerIndex].currentLevel = currentLevel
    saves.players[playerIndex].completedLevels = completedLevels
    saves.players[playerIndex].timestamp = Date.now()
    saveCareerData(saves)
  }
}

// Award BTC to player
export function awardBTC(username: string, amount: number): void {
  console.log('[CAREER MANAGER DEBUG] awardBTC called')
  console.log('[CAREER MANAGER DEBUG]   username:', username)
  console.log('[CAREER MANAGER DEBUG]   amount:', amount)

  const saves = loadCareerSaves()
  const playerIndex = saves.players.findIndex(
    p => p.username.toLowerCase() === username.toLowerCase()
  )

  if (playerIndex !== -1) {
    const player = saves.players[playerIndex]
    if (!player.btcBalance) player.btcBalance = 0
    player.btcBalance += amount
    player.timestamp = Date.now()
    saveCareerData(saves)
    console.log('[CAREER MANAGER DEBUG] Awarded', amount, 'BTC. New balance:', player.btcBalance)
  }
}

// Purchase car with BTC
export function purchaseCar(username: string, carId: number, cost: number): boolean {
  const saves = loadCareerSaves()
  const playerIndex = saves.players.findIndex(
    p => p.username.toLowerCase() === username.toLowerCase()
  )

  if (playerIndex !== -1) {
    const player = saves.players[playerIndex]
    if (!player.btcBalance) player.btcBalance = 0
    if (!player.ownedCars) player.ownedCars = [1, 5]

    // Check if player has enough BTC and doesn't already own the car
    if (player.btcBalance >= cost && !player.ownedCars.includes(carId)) {
      player.btcBalance -= cost
      player.ownedCars.push(carId)
      player.timestamp = Date.now()
      saveCareerData(saves)
      console.log('[CAREER MANAGER DEBUG] Purchased car', carId, 'for', cost, 'BTC')
      return true
    }
  }
  return false
}

// Complete a level and advance to next
export function completeLevel(username: string, levelNumber: number, coinsCollected: number = 0): void {
  console.log('[CAREER MANAGER DEBUG] completeLevel called')
  console.log('[CAREER MANAGER DEBUG]   username:', username)
  console.log('[CAREER MANAGER DEBUG]   levelNumber:', levelNumber)
  console.log('[CAREER MANAGER DEBUG]   coinsCollected:', coinsCollected)

  const saves = loadCareerSaves()
  const playerIndex = saves.players.findIndex(
    p => p.username.toLowerCase() === username.toLowerCase()
  )

  console.log('[CAREER MANAGER DEBUG]   playerIndex:', playerIndex)

  if (playerIndex !== -1) {
    const player = saves.players[playerIndex]
    console.log('[CAREER MANAGER DEBUG]   Player before update:', JSON.stringify(player))

    // Add to completed levels if not already there
    if (!player.completedLevels.includes(levelNumber)) {
      player.completedLevels.push(levelNumber)
      player.completedLevels.sort((a, b) => a - b)
    }

    // Add coins to total
    if (!player.totalCoins) {
      console.log('[CAREER MANAGER DEBUG]   Player totalCoins was undefined, initializing to 0')
      player.totalCoins = 0
    }
    console.log('[CAREER MANAGER DEBUG]   Previous totalCoins:', player.totalCoins)
    player.totalCoins += coinsCollected
    console.log('[CAREER MANAGER DEBUG]   New totalCoins:', player.totalCoins)

    // Advance to next level if not at max
    if (levelNumber < 5) {
      player.currentLevel = levelNumber + 1
    }

    player.timestamp = Date.now()
    console.log('[CAREER MANAGER DEBUG]   Player after update:', JSON.stringify(player))

    saveCareerData(saves)
    console.log('[CAREER MANAGER DEBUG] completeLevel finished')
  } else {
    console.error('[CAREER MANAGER DEBUG] ERROR: Player not found in saves!')
  }
}
