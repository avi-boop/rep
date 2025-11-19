import { useState, useEffect, useCallback } from 'react'

export type FavoriteType = 'brand' | 'model' | 'repair'

export interface Favorite {
  id: number
  type: FavoriteType
  timestamp: number
}

const STORAGE_KEY = 'pricing_favorites'

export function useFavorites(type: FavoriteType) {
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const allFavorites: Favorite[] = JSON.parse(stored)
        const typeFavorites = allFavorites
          .filter(f => f.type === type)
          .map(f => f.id)
        setFavorites(new Set(typeFavorites))
      }
    } catch (error) {
      console.error('Error loading favorites:', error)
    }
  }, [type])

  // Save favorites to localStorage
  const saveFavorites = useCallback((newFavorites: Set<number>) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      let allFavorites: Favorite[] = stored ? JSON.parse(stored) : []

      // Remove old favorites of this type
      allFavorites = allFavorites.filter(f => f.type !== type)

      // Add new favorites of this type
      const typeFavorites: Favorite[] = Array.from(newFavorites).map(id => ({
        id,
        type,
        timestamp: Date.now()
      }))

      allFavorites = [...allFavorites, ...typeFavorites]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allFavorites))
    } catch (error) {
      console.error('Error saving favorites:', error)
    }
  }, [type])

  const toggleFavorite = useCallback((id: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(id)) {
        newFavorites.delete(id)
      } else {
        newFavorites.add(id)
      }
      saveFavorites(newFavorites)
      return newFavorites
    })
  }, [saveFavorites])

  const isFavorite = useCallback((id: number) => {
    return favorites.has(id)
  }, [favorites])

  const clearFavorites = useCallback(() => {
    setFavorites(new Set())
    saveFavorites(new Set())
  }, [saveFavorites])

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    favoriteCount: favorites.size
  }
}
