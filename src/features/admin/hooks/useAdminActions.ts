import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as auth from '../api/auth'
import * as data from '../api/data'
import * as images from '../api/images'

export function useAdminAction<T, R>(action: (input: T) => Promise<R>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: T) => action(input),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['admin'] }),
        client.invalidateQueries({ queryKey: ['admin-session'] }),
      ])
    },
  })
}
// Components only import this hook boundary, never the remote API layer.
export function useAuthActions() {
  return {
    login: useAdminAction(
      ({ email, password }: { email: string; password: string }) =>
        auth.signIn(email, password),
    ),
    logout: useAdminAction((others: boolean) => auth.signOut(others)),
    recover: useAdminAction(auth.recoverPassword),
    password: useAdminAction(auth.updatePassword),
    email: useAdminAction(auth.updateEmail),
    enroll: useAdminAction(() => auth.enrollFactor()),
    verify: useAdminAction(({ id, code }: { id: string; code: string }) =>
      auth.verifyFactor(id, code),
    ),
  }
}
export function useContentActions() {
  return {
    save: useAdminAction((args: Parameters<typeof data.saveContent>) =>
      data.saveContent(...args),
    ),
    archive: useAdminAction((args: Parameters<typeof data.archiveContent>) =>
      data.archiveContent(...args),
    ),
    deleteNews: useAdminAction(([id, version]: [id: string, version: string]) =>
      images.deleteNewsPermanently(id, version),
    ),
  }
}
export function useRoleActions() {
  return {
    save: useAdminAction((args: Parameters<typeof data.saveRole>) =>
      data.saveRole(...args),
    ),
    remove: useAdminAction(data.deleteRole),
  }
}
export function useUserActions() {
  return {
    invite: useAdminAction((args: Parameters<typeof data.inviteUser>) =>
      data.inviteUser(...args),
    ),
    save: useAdminAction((args: Parameters<typeof data.saveUser>) =>
      data.saveUser(...args),
    ),
  }
}
