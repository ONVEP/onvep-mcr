import vine from '@vinejs/vine'

export const signInValidator = vine.create({
  email: vine.string().email().toLowerCase().trim(),
  password: vine.string(),
})

export const forgotPasswordValidator = vine.create({
  email: vine.string().email().trim().normalizeEmail({ gmail_remove_dots: false }),
})

export const resetPasswordValidator = vine.create({
  password: vine.string().confirmed({ confirmationField: 'passwordConfirmation' }),
})
