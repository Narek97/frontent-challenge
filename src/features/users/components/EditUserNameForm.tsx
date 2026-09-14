import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { saveUserNameEdit } from '../lib/userNameEdits'
import './EditUserNameForm.css'

interface EditUserNameFormValues {
  name: string
}

interface EditUserNameFormProps {
  userId: number
  currentName: string
  onSaved: (name: string) => void
}

export function EditUserNameForm({ userId, currentName, onSaved }: EditUserNameFormProps) {
  const [justSaved, setJustSaved] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserNameFormValues>({
    defaultValues: { name: currentName },
  })

  const onSubmit = (values: EditUserNameFormValues) => {
    const trimmedName = values.name.trim()
    saveUserNameEdit(userId, trimmedName)
    reset({ name: trimmedName })
    setJustSaved(true)
    onSaved(trimmedName)
  }

  return (
    <form
      className="edit-user-name-form"
      onSubmit={handleSubmit(onSubmit)}
      onChange={() => setJustSaved(false)}
      noValidate
    >
      <label className="edit-user-name-form__field">
        <span>Name</span>
        <input
          type="text"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'edit-user-name-error' : undefined}
          {...register('name', {
            validate: (value) => value.trim().length > 0 || 'Name cannot be empty.',
          })}
        />
      </label>
      {errors.name ? (
        <p id="edit-user-name-error" className="edit-user-name-form__error" role="alert">
          {errors.name.message}
        </p>
      ) : null}
      <button type="submit">Save name</button>
      {justSaved ? (
        <p className="edit-user-name-form__saved" role="status">
          Saved.
        </p>
      ) : null}
    </form>
  )
}
