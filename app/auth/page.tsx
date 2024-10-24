'use client'
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { TextInput, PasswordInput, Button, Group, Box, Tabs } from '@mantine/core'
import { useForm } from '@mantine/form'
import clientPromise from "../../util/mongodb"

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string | null>('login')
  const router = useRouter()

  const form = useForm({
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: (value) => (value.length < 3 ? 'Username must be at least 3 characters long' : null),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters long' : null),
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    if (activeTab === 'login') {
      const result = await signIn("credentials", {
        username: values.username,
        password: values.password,
        redirect: false,
      })
      if (result?.error) {
        console.error(result.error)
        form.setFieldError('password', 'Invalid username or password')
      } else {
        router.push("/dashboard")
      }
    } else {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        const data = await response.json()
        if (response.ok) {
          await signIn("credentials", {
            username: values.username,
            password: values.password,
            redirect: false,
          })
          router.push("/dashboard")
        } else {
          form.setFieldError('username', data.message || 'An error occurred')
        }
      } catch (error) {
        console.error('Registration error:', error)
        form.setFieldError('username', 'An error occurred during registration')
      }
    }
  }

  return (
    <Box maw={340} mx="auto">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="login">Войти</Tabs.Tab>
          <Tabs.Tab value="register">Создать аккаунт</Tabs.Tab>
        </Tabs.List>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Имя пользователя"
            placeholder="user"
            {...form.getInputProps('username')}
          />
          <PasswordInput
            label="Пароль"
            placeholder="password"
            mt="md"
            {...form.getInputProps('password')}
          />
          <Group justify="flex-end" mt="md">
            <Button type="submit">
              {activeTab === 'login' ? 'Войти' : 'Создать аккаунт'}
            </Button>
          </Group>
        </form>
      </Tabs>
    </Box>
  )
}