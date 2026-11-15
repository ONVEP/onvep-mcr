/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractRawResponse, ExtractResponse, Method, PathWithRegistry, PatternsByMethod, RouteWithRegistry } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'
import type { routes } from './index.ts'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'drive.fs.serve': {
    methods: ["GET","HEAD"]
    pattern: '/uploads/*'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { '*': ParamValue[] }
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'marketing.show': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/marketing/controllers/marketing_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/marketing/controllers/marketing_controller').default['handle']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/marketing/controllers/marketing_controller').default['handle']>>>
    }
  }
  'auth.sign_in.show': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/sign_in_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/sign_in_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/sign_in_controller').default['show']>>>
    }
  }
  'auth.sign_in.handle': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#auth/validators/auth').signInValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#auth/validators/auth').signInValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/sign_in_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/sign_in_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/sign_in_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.sign_out.handle': {
    methods: ["POST"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/sign_out_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/sign_out_controller').default['handle']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/sign_out_controller').default['handle']>>>
    }
  }
  'auth.forgot_password.show': {
    methods: ["GET","HEAD"]
    pattern: '/forgot-password'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/forgot_password_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/forgot_password_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/forgot_password_controller').default['show']>>>
    }
  }
  'auth.forgot_password.handle': {
    methods: ["POST"]
    pattern: '/forgot-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#auth/validators/auth').forgotPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#auth/validators/auth').forgotPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/forgot_password_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/forgot_password_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/forgot_password_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.reset_password.show': {
    methods: ["GET","HEAD"]
    pattern: '/reset-password/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/reset_password_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/reset_password_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/reset_password_controller').default['show']>>>
    }
  }
  'auth.reset_password.handle': {
    methods: ["POST"]
    pattern: '/reset-password/:token'
    types: {
      body: ExtractBody<InferInput<(typeof import('#auth/validators/auth').resetPasswordValidator)>>
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#auth/validators/auth').resetPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/auth/controllers/reset_password_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/auth/controllers/reset_password_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/auth/controllers/reset_password_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'locale.switch': {
    methods: ["POST"]
    pattern: '/switch/:locale'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { locale: ParamValue }
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'users.invite.show': {
    methods: ["GET","HEAD"]
    pattern: '/users/invite'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/invite_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/invite_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/invite_controller').default['show']>>>
    }
  }
  'users.invite.handle': {
    methods: ["POST"]
    pattern: '/users/invite'
    types: {
      body: ExtractBody<InferInput<(typeof import('#users/validators/users').inviteUserValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#users/validators/users').inviteUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/invite_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/invite_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/invite_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'users.impersonate.handle': {
    methods: ["POST"]
    pattern: '/users/impersonate/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/impersonates_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/impersonates_controller').default['store']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/impersonates_controller').default['store']>>>
    }
  }
  'users.index': {
    methods: ["GET","HEAD"]
    pattern: '/users'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#users/validators/users').listUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'users.create': {
    methods: ["GET","HEAD"]
    pattern: '/users/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['create']>>>
    }
  }
  'users.store': {
    methods: ["POST"]
    pattern: '/users'
    types: {
      body: ExtractBody<InferInput<(typeof import('#users/validators/users').createUserValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#users/validators/users').createUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'users.edit': {
    methods: ["GET","HEAD"]
    pattern: '/users/:id/edit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['edit']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['edit']>>>
    }
  }
  'users.update': {
    methods: ["PUT","PATCH"]
    pattern: '/users/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#users/validators/users').editUserValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#users/validators/users').editUserValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'users.destroy': {
    methods: ["DELETE"]
    pattern: '/users/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/users_controller').default['destroy']>>>
    }
  }
  'roles.index': {
    methods: ["GET","HEAD"]
    pattern: '/roles'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['index']>>>
    }
  }
  'roles.create': {
    methods: ["GET","HEAD"]
    pattern: '/roles/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['create']>>>
    }
  }
  'roles.store': {
    methods: ["POST"]
    pattern: '/roles'
    types: {
      body: ExtractBody<InferInput<(typeof import('#users/validators/roles').createRoleValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#users/validators/roles').createRoleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'roles.edit': {
    methods: ["GET","HEAD"]
    pattern: '/roles/:id/edit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['edit']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['edit']>>>
    }
  }
  'roles.update': {
    methods: ["PUT","PATCH"]
    pattern: '/roles/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#users/validators/roles').editRoleValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#users/validators/roles').editRoleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'roles.destroy': {
    methods: ["DELETE"]
    pattern: '/roles/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/roles_controller').default['destroy']>>>
    }
  }
  'settings.index': {
    methods: ["GET","HEAD"]
    pattern: '/settings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/settings_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/settings_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/settings_controller').default['show']>>>
    }
  }
  'profile.update': {
    methods: ["PUT"]
    pattern: '/settings/profile'
    types: {
      body: ExtractBody<InferInput<(typeof import('#users/validators/users').updateProfileValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#users/validators/users').updateProfileValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/profile_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/profile_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/profile_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'password.update': {
    methods: ["PUT"]
    pattern: '/settings/password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#users/validators/users').updatePasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#users/validators/users').updatePasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/password_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/password_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/password_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'tokens.destroy': {
    methods: ["DELETE"]
    pattern: '/settings/tokens/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/tokens_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/tokens_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/tokens_controller').default['destroy']>>>
    }
  }
  'tokens.store': {
    methods: ["POST"]
    pattern: '/settings/tokens'
    types: {
      body: ExtractBody<InferInput<(typeof import('#users/validators/tokens').createTokenValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#users/validators/tokens').createTokenValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/users/controllers/tokens_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/users/controllers/tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/users/controllers/tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'dashboard.show': {
    methods: ["GET","HEAD"]
    pattern: '/dashboard'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#analytics/validators/dashboard').dashboardQueryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/analytics/controllers/dashboard_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/analytics/controllers/dashboard_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/analytics/controllers/dashboard_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'network_drives.index': {
    methods: ["GET","HEAD"]
    pattern: '/media/network-drives'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: ExtractQueryForGet<InferInput<(typeof import('#media/validators/network_drives').listNetworkDriveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['index']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'network_drives.create': {
    methods: ["GET","HEAD"]
    pattern: '/media/network-drives/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['create']>>>
    }
  }
  'network_drives.store': {
    methods: ["POST"]
    pattern: '/media/network-drives'
    types: {
      body: ExtractBody<InferInput<(typeof import('#media/validators/network_drives').createNetworkDriveValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#media/validators/network_drives').createNetworkDriveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'network_drives.edit': {
    methods: ["GET","HEAD"]
    pattern: '/media/network-drives/:id/edit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['edit']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['edit']>>>
    }
  }
  'network_drives.update': {
    methods: ["PUT","PATCH"]
    pattern: '/media/network-drives/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#media/validators/network_drives').editNetworkDriveValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#media/validators/network_drives').editNetworkDriveValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'network_drives.destroy': {
    methods: ["DELETE"]
    pattern: '/media/network-drives/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/media/controllers/network_drives_controller').default['destroy']>>>
    }
  }
  'live.show': {
    methods: ["GET","HEAD"]
    pattern: '/live'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/rundowns/controllers/live_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/rundowns/controllers/live_controller').default['handle']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/rundowns/controllers/live_controller').default['handle']>>>
    }
  }
  'rundowns.index': {
    methods: ["GET","HEAD"]
    pattern: '/preparation'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['index']>>>
    }
  }
  'rundowns.create': {
    methods: ["GET","HEAD"]
    pattern: '/preparation/create'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['create']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['create']>>>
    }
  }
  'rundowns.store': {
    methods: ["POST"]
    pattern: '/preparation'
    types: {
      body: ExtractBody<InferInput<(typeof import('#rundowns/validators/rundowns').rundownValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#rundowns/validators/rundowns').rundownValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'rundowns.show': {
    methods: ["GET","HEAD"]
    pattern: '/preparation/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['show']>>>
    }
  }
  'rundowns.edit': {
    methods: ["GET","HEAD"]
    pattern: '/preparation/:id/edit'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['edit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['edit']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['edit']>>>
    }
  }
  'rundowns.update': {
    methods: ["PUT","PATCH"]
    pattern: '/preparation/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#rundowns/validators/rundowns').rundownValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#rundowns/validators/rundowns').rundownValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'rundowns.destroy': {
    methods: ["DELETE"]
    pattern: '/preparation/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/rundowns/controllers/rundowns_controller').default['destroy']>>>
    }
  }
  'steps.store': {
    methods: ["POST"]
    pattern: '/preparation/:rundown_id/steps'
    types: {
      body: ExtractBody<InferInput<(typeof import('#rundowns/validators/steps').stepValidator)>>
      paramsTuple: [ParamValue]
      params: { rundown_id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#rundowns/validators/steps').stepValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/rundowns/controllers/steps_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/rundowns/controllers/steps_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/rundowns/controllers/steps_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'steps.update': {
    methods: ["PUT"]
    pattern: '/preparation/:rundown_id/steps/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#rundowns/validators/steps').stepValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { rundown_id: ParamValue; id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#rundowns/validators/steps').stepValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/rundowns/controllers/steps_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/rundowns/controllers/steps_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/rundowns/controllers/steps_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'steps.destroy': {
    methods: ["DELETE"]
    pattern: '/preparation/:rundown_id/steps/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { rundown_id: ParamValue; id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/rundowns/controllers/steps_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/rundowns/controllers/steps_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/rundowns/controllers/steps_controller').default['destroy']>>>
    }
  }
  'steps.move': {
    methods: ["POST"]
    pattern: '/preparation/:rundown_id/steps/:id/move'
    types: {
      body: ExtractBody<InferInput<(typeof import('#rundowns/validators/steps').moveStepValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { rundown_id: ParamValue; id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#rundowns/validators/steps').moveStepValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/rundowns/controllers/step_moves_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/rundowns/controllers/step_moves_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/rundowns/controllers/step_moves_controller').default['handle']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'step_types.index': {
    methods: ["GET","HEAD"]
    pattern: '/rundowns/step-types'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/rundowns/controllers/step_types_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/rundowns/controllers/step_types_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/rundowns/controllers/step_types_controller').default['index']>>>
    }
  }
  'step_types.store': {
    methods: ["POST"]
    pattern: '/rundowns/step-types'
    types: {
      body: ExtractBody<InferInput<(typeof import('#rundowns/validators/step_types').createStepTypeValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#rundowns/validators/step_types').createStepTypeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/rundowns/controllers/step_types_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/rundowns/controllers/step_types_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/rundowns/controllers/step_types_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'step_types.update': {
    methods: ["PUT","PATCH"]
    pattern: '/rundowns/step-types/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#rundowns/validators/step_types').editStepTypeValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#rundowns/validators/step_types').editStepTypeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/rundowns/controllers/step_types_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/rundowns/controllers/step_types_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/rundowns/controllers/step_types_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'step_types.destroy': {
    methods: ["DELETE"]
    pattern: '/rundowns/step-types/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/rundowns/controllers/step_types_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/rundowns/controllers/step_types_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/rundowns/controllers/step_types_controller').default['destroy']>>>
    }
  }
  'layers.index': {
    methods: ["GET","HEAD"]
    pattern: '/graphics'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/graphics/controllers/layers_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/graphics/controllers/layers_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/graphics/controllers/layers_controller').default['index']>>>
    }
  }
  'layers.store': {
    methods: ["POST"]
    pattern: '/graphics'
    types: {
      body: ExtractBody<InferInput<(typeof import('#graphics/validators/layers').createLayerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#graphics/validators/layers').createLayerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/graphics/controllers/layers_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/graphics/controllers/layers_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/graphics/controllers/layers_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'layers.show': {
    methods: ["GET","HEAD"]
    pattern: '/graphics/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/graphics/controllers/layers_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/graphics/controllers/layers_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/graphics/controllers/layers_controller').default['show']>>>
    }
  }
  'layers.update': {
    methods: ["PUT"]
    pattern: '/graphics/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#graphics/validators/layers').updateLayerValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#graphics/validators/layers').updateLayerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/graphics/controllers/layers_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/graphics/controllers/layers_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/graphics/controllers/layers_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'layers.destroy': {
    methods: ["DELETE"]
    pattern: '/graphics/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/graphics/controllers/layers_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/graphics/controllers/layers_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/graphics/controllers/layers_controller').default['destroy']>>>
    }
  }
  'graphics.tailwind_classes': {
    methods: ["GET","HEAD"]
    pattern: '/graphics/tailwind-classes'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/graphics/controllers/tailwind_classes_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/graphics/controllers/tailwind_classes_controller').default['handle']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/graphics/controllers/tailwind_classes_controller').default['handle']>>>
    }
  }
  'cg.all': {
    methods: ["GET","HEAD"]
    pattern: '/cg/all'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/graphics/controllers/cg_controller').default['all']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/graphics/controllers/cg_controller').default['all']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/graphics/controllers/cg_controller').default['all']>>>
    }
  }
  'cg.layer': {
    methods: ["GET","HEAD"]
    pattern: '/cg/layer/:slug'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/graphics/controllers/cg_controller').default['layer']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/graphics/controllers/cg_controller').default['layer']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/graphics/controllers/cg_controller').default['layer']>>>
    }
  }
  'cg.tailwind': {
    methods: ["GET","HEAD"]
    pattern: '/cg/assets/tailwind.js'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/graphics/controllers/cg_controller').default['tailwind']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/graphics/controllers/cg_controller').default['tailwind']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/graphics/controllers/cg_controller').default['tailwind']>>>
    }
  }
  'context.index': {
    methods: ["GET","HEAD"]
    pattern: '/context'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/context_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/context_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/context_controller').default['index']>>>
    }
  }
  'context.values.update': {
    methods: ["PUT"]
    pattern: '/context/values'
    types: {
      body: ExtractBody<InferInput<(typeof import('#context/validators/values').contextValueValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#context/validators/values').contextValueValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/context_values_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/context_values_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/context_values_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'context.values.store': {
    methods: ["POST"]
    pattern: '/context/values'
    types: {
      body: ExtractBody<InferInput<(typeof import('#context/validators/values').contextValueValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#context/validators/values').contextValueValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/context_values_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/context_values_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/context_values_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'context.values.destroy': {
    methods: ["DELETE"]
    pattern: '/context/values'
    types: {
      body: ExtractBody<InferInput<(typeof import('#context/validators/values').contextPathValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#context/validators/values').contextPathValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/context_values_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/context_values_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/context_values_controller').default['destroy']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'context.mutators.index': {
    methods: ["GET","HEAD"]
    pattern: '/context/mutators'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/mutators_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/mutators_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/mutators_controller').default['index']>>>
    }
  }
  'context.mutators.store': {
    methods: ["POST"]
    pattern: '/context/mutators'
    types: {
      body: ExtractBody<InferInput<(typeof import('#context/validators/mutators').createMutatorValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#context/validators/mutators').createMutatorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/mutators_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/mutators_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/mutators_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'context.mutators.show': {
    methods: ["GET","HEAD"]
    pattern: '/context/mutators/:name'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { name: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/mutators_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/mutators_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/mutators_controller').default['show']>>>
    }
  }
  'context.mutators.update': {
    methods: ["PUT"]
    pattern: '/context/mutators/:name'
    types: {
      body: ExtractBody<InferInput<(typeof import('#context/validators/mutators').updateMutatorValidator)>>
      paramsTuple: [ParamValue]
      params: { name: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#context/validators/mutators').updateMutatorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/mutators_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/mutators_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/mutators_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'context.mutators.destroy': {
    methods: ["DELETE"]
    pattern: '/context/mutators/:name'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { name: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/mutators_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/mutators_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/mutators_controller').default['destroy']>>>
    }
  }
  'context.validators.index': {
    methods: ["GET","HEAD"]
    pattern: '/context/validators'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/validators_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/validators_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/validators_controller').default['index']>>>
    }
  }
  'context.validators.store': {
    methods: ["POST"]
    pattern: '/context/validators'
    types: {
      body: ExtractBody<InferInput<(typeof import('#context/validators/context_validators').createContextValidatorValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#context/validators/context_validators').createContextValidatorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/validators_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/validators_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/validators_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'context.validators.show': {
    methods: ["GET","HEAD"]
    pattern: '/context/validators/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/validators_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/validators_controller').default['show']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/validators_controller').default['show']>>>
    }
  }
  'context.validators.update': {
    methods: ["PUT"]
    pattern: '/context/validators/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#context/validators/context_validators').updateContextValidatorValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#context/validators/context_validators').updateContextValidatorValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/validators_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/validators_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/validators_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'context.validators.destroy': {
    methods: ["DELETE"]
    pattern: '/context/validators/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/validators_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/validators_controller').default['destroy']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/validators_controller').default['destroy']>>>
    }
  }
  'context.versions.index': {
    methods: ["GET","HEAD"]
    pattern: '/context/versions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/versions_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/versions_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/versions_controller').default['index']>>>
    }
  }
  'context.versions.show': {
    methods: ["GET","HEAD"]
    pattern: '/context/versions/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQueryForGet<InferInput<(typeof import('#context/validators/versions').listContextVersionsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/versions_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/versions_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/versions_controller').default['show']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'context.versions.restore': {
    methods: ["POST"]
    pattern: '/context/versions/:id/restore'
    types: {
      body: ExtractBody<InferInput<(typeof import('#context/validators/versions').restoreContextVersionValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#context/validators/versions').restoreContextVersionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#app/context/controllers/versions_controller').default['restore']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/context/controllers/versions_controller').default['restore']>>> | { status: 422; response: { errors: SimpleError[] } }
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/context/controllers/versions_controller').default['restore']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'notifications.index': {
    methods: ["GET","HEAD"]
    pattern: '/notifications'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/notifications/controllers/notifications_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/notifications/controllers/notifications_controller').default['index']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/notifications/controllers/notifications_controller').default['index']>>>
    }
  }
  'notifications.markRead': {
    methods: ["POST"]
    pattern: '/notifications/:id/read'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/notifications/controllers/notifications_controller').default['markRead']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/notifications/controllers/notifications_controller').default['markRead']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/notifications/controllers/notifications_controller').default['markRead']>>>
    }
  }
  'notifications.markAllSeen': {
    methods: ["POST"]
    pattern: '/notifications/seen'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/notifications/controllers/notifications_controller').default['markAllSeen']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/notifications/controllers/notifications_controller').default['markAllSeen']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/notifications/controllers/notifications_controller').default['markAllSeen']>>>
    }
  }
  'notifications.markAllRead': {
    methods: ["POST"]
    pattern: '/notifications/read'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#app/notifications/controllers/notifications_controller').default['markAllRead']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#app/notifications/controllers/notifications_controller').default['markAllRead']>>>
      rawResponse: ExtractRawResponse<Awaited<ReturnType<import('#app/notifications/controllers/notifications_controller').default['markAllRead']>>>
    }
  }
  'event_stream': {
    methods: ["GET","HEAD"]
    pattern: '/__transmit/events'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'subscribe': {
    methods: ["POST"]
    pattern: '/__transmit/subscribe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
  'unsubscribe': {
    methods: ["POST"]
    pattern: '/__transmit/unsubscribe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
      rawResponse: ExtractRawResponse<unknown>
    }
  }
}

export namespace Route {
  export type Request<Name extends keyof typeof routes> = RouteWithRegistry.Request<typeof routes, Name>
  export type Response<Name extends keyof typeof routes> = RouteWithRegistry.Response<typeof routes, Name>
  export type Params<Name extends keyof typeof routes> = RouteWithRegistry.Params<typeof routes, Name>
  export type Body<Name extends keyof typeof routes> = RouteWithRegistry.Body<typeof routes, Name>
  export type Query<Name extends keyof typeof routes> = RouteWithRegistry.Query<typeof routes, Name>
  export type Error<Name extends keyof typeof routes> = RouteWithRegistry.Error<typeof routes, Name>
}

export namespace Path {
  export type Request<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Request<typeof routes, M, P>
  export type Response<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Response<typeof routes, M, P>
  export type Params<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Params<typeof routes, M, P>
  export type Body<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Body<typeof routes, M, P>
  export type Query<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Query<typeof routes, M, P>
  export type Error<M extends Method, P extends PatternsByMethod<typeof routes, M>> =
    PathWithRegistry.Error<typeof routes, M, P>
}
