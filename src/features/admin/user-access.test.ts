import { expect, it } from 'vitest'
import { accessRoles } from '@/test/admin-access'
import { userAccessChanged, validateUserAccess } from './user-access'

it('validates invitations with a trimmed email and between one and ten UUID roles', () => {
  const values = {
    email: '  new@example.test  ',
    roles: [accessRoles[0]!.id],
    active: true,
  }
  expect(validateUserAccess(values)).toMatchObject({
    success: true,
    data: { email: 'new@example.test' },
  })
  expect(validateUserAccess({ ...values, email: 'invalid' }).success).toBe(
    false,
  )
  expect(validateUserAccess({ ...values, roles: [] }).success).toBe(false)
  expect(
    validateUserAccess({
      ...values,
      roles: accessRoles.slice(0, 11).map((role) => role.id),
    }).success,
  ).toBe(false)
  expect(validateUserAccess({ ...values, roles: ['unknown'] }).success).toBe(
    false,
  )
})
it('treats role order as unchanged while detecting real access changes', () => {
  const values = {
    email: 'new@example.test',
    roles: accessRoles.slice(0, 2).map((role) => role.id),
    active: true,
  }
  expect(
    userAccessChanged(values, {
      ...values,
      roles: [...values.roles].reverse(),
    }),
  ).toBe(false)
  expect(userAccessChanged(values, { ...values, active: false })).toBe(true)
  expect(
    userAccessChanged(values, { ...values, roles: values.roles.slice(0, 1) }),
  ).toBe(true)
})
