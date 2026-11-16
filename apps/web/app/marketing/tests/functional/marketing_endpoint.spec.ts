import { test } from '@japa/runner'

test.group('Endpoint GET /', () => {
  test('renders the landing page without auth', async ({ client }) => {
    const response = await client.get('/').withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('marketing/show')
  })
})
