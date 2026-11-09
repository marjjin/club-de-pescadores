import { describe, expect, it } from 'vitest'
import { validateEmailChange, validatePasswordChange } from './account-forms'

describe('account form validation', () => {
  it('normalizes email whitespace and compares confirmations without case sensitivity', () => {
    expect(
      validateEmailChange(
        'old@example.test',
        ' next@example.test ',
        'NEXT@example.test',
      ),
    ).toEqual({ success: true, email: 'next@example.test' })
  })

  it('rejects the current email and invalid addresses', () => {
    expect(
      validateEmailChange(
        'owner@example.test',
        'OWNER@example.test',
        'owner@example.test',
      ).success,
    ).toBe(false)
    expect(
      validateEmailChange('owner@example.test', 'invalid', 'invalid').success,
    ).toBe(false)
    expect(
      validateEmailChange('owner@example.test', 'next@example.test', '')
        .success,
    ).toBe(false)
  })

  it('requires exact password confirmation and preserves intentional spaces', () => {
    const password = ' sample-password '
    expect(validatePasswordChange(password, password)).toEqual({
      success: true,
      password,
    })
    expect(validatePasswordChange(password, password.trim()).success).toBe(
      false,
    )
  })

  it.each([11, 129])('rejects a password with %i characters', (length) => {
    expect(
      validatePasswordChange('a'.repeat(length), 'a'.repeat(length)).success,
    ).toBe(false)
  })

  it.each([12, 128])('accepts the password length boundary of %i', (length) => {
    expect(
      validatePasswordChange('a'.repeat(length), 'a'.repeat(length)).success,
    ).toBe(true)
  })
})
