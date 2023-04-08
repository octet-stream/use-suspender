type CreateContainer = () => HTMLDivElement

type CleanupContainers = () => void

export interface CreateContainerFactoryResult {
  createContainer: CreateContainer
  cleanupContainers: CleanupContainers
}

export function createContainerFactory(): CreateContainerFactoryResult {
  const containers = new Set<HTMLDivElement>()

  const createContainer: CreateContainer = () => {
    const container = document.createElement("div")

    containers.add(container)

    return document.body.appendChild(container)
  }

  const cleanupContainers: CleanupContainers = () => {
    for (const container of containers) {
      document.body.removeChild(container)
    }

    containers.clear()
  }

  return {createContainer, cleanupContainers}
}
