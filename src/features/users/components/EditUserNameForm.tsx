import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveUserNameEdit } from '../lib/userNameEdits'

interface EditUserNameFormValues {
  name: string
}

interface EditUserNameFormProps {
  userId: number
  currentName: string
  onSaved: (name: string) => void
}

// Kept short and deliberate: the actual save is an instant localStorage write,
// but a save with no perceptible duration reads as if nothing happened. This
// makes the "Saving…" state (and the disabled form) actually visible.
const SAVE_DELAY_MS = 350

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function EditUserNameForm({ userId, currentName, onSaved }: EditUserNameFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserNameFormValues>({
    defaultValues: { name: currentName },
  })

  const onSubmit = async (values: EditUserNameFormValues) => {
    const trimmedName = values.name.trim()
    await wait(SAVE_DELAY_MS)
    saveUserNameEdit(userId, trimmedName)
    reset({ name: trimmedName })
    onSaved(trimmedName)
    toast.success('Name saved')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <fieldset className="m-0 flex flex-wrap items-end gap-3 border-0 p-0" disabled={isSubmitting}>
        <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          <Label htmlFor="edit-user-name-input">Name</Label>
          <Input
            id="edit-user-name-input"
            type="text"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'edit-user-name-error' : undefined}
            {...register('name', {
              validate: (value) => value.trim().length > 0 || 'Name cannot be empty.',
            })}
          />
        </div>
        {errors.name ? (
          <p
            id="edit-user-name-error"
            className="text-destructive order-3 basis-full text-sm font-medium"
            role="alert"
          >
            {errors.name.message}
          </p>
        ) : null}
        <Button type="submit">
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            'Save name'
          )}
        </Button>
      </fieldset>
    </form>
  )
}
