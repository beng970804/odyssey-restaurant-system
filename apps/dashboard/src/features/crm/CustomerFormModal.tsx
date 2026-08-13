import { getListCustomersQueryKey, useCreateCustomer } from '@repo/api-client'
import { Button, Field, Input, Modal, Textarea, useToast } from '@repo/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function CustomerFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  const create = useCreateCustomer({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() })
        toast.show('Customer added', 'success')
        setName('')
        setPhone('')
        setEmail('')
        setNotes('')
        onClose()
      },
      onError: () => toast.show('Could not add the customer', 'danger'),
    },
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New customer"
      footer={
        <>
          <Button variant="secondary" onPress={onClose}>
            Cancel
          </Button>
          <Button
            onPress={() =>
              create.mutate({
                data: {
                  name: name.trim(),
                  phone: phone.trim() || null,
                  email: email.trim() || null,
                  notes: notes.trim() || null,
                },
              })
            }
            disabled={name.trim().length === 0}
            loading={create.isPending}
          >
            Add customer
          </Button>
        </>
      }
    >
      <Field label="Name" required>
        <Input value={name} onChangeText={setName} placeholder="Aisyah Rahman" />
      </Field>
      <Field label="Phone">
        <Input value={phone} onChangeText={setPhone} placeholder="+65 8123 4567" />
      </Field>
      <Field label="Email">
        <Input value={email} onChangeText={setEmail} placeholder="aisyah@example.com" />
      </Field>
      <Field label="Notes" hint="Allergies, preferences — anything the kitchen should know">
        <Textarea value={notes} onChangeText={setNotes} placeholder="Allergic to shellfish" />
      </Field>
    </Modal>
  )
}
