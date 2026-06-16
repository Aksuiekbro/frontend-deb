import nextJest from 'next/jest.js'

// next/jest wires up SWC transforms, tsconfig path aliases (@/*), and .env loading.
const createJestConfig = nextJest({ dir: './' })

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
}

export default createJestConfig(config)
