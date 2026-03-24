export default {
  translation: {
    appName: 'Task Manager',
    flash: {
      session: {
        create: {
          success: 'You are logged in',
          error: 'Wrong email or password',
        },
        delete: {
          success: 'You are logged out',
        },
      },
      users: {
        create: {
          error: 'Failed to register',
          success: 'User registered successfully',
        },
        update: {
          error: 'Failed to update user',
          success: 'User updated successfully',
        },
        delete: {
          error: 'User cannot be deleted',
          success: 'User deleted successfully',
        },
      },
      statuses: {
        create: {
          success: 'Status successfully created',
          error: 'Failed to create status',
        },
        edit: {
          success: 'Status successfully updated',
          error: 'Failed to update status',
        },
        delete: {
          success: 'Status successfully deleted',
          hasTasks: 'Cannot delete status linked to a task',
        },
      },
      tasks: {
        create: {
          success: 'Task successfully created',
          error: 'Failed to create task',
        },
        edit: {
          success: 'Task successfully updated',
          error: 'Failed to update task',
        },
        delete: {
          success: 'Task successfully deleted',
          accessError: 'Only the creator can delete this task',
        },
      },
      labels: {
        create: {
          success: 'Label successfully created',
          error: 'Failed to create label',
        },
        edit: {
          success: 'Label successfully updated',
          error: 'Failed to update label',
        },
        delete: {
          success: 'Label successfully deleted',
          hasTasks: 'Cannot delete label linked to a task',
        },
      },
      authError: 'Access denied! Please login',
    },
    layouts: {
      application: {
        users: 'Users',
        statuses: 'Statuses',
        tasks: 'Tasks',
        labels: 'Labels',
        signIn: 'Login',
        signUp: 'Register',
        signOut: 'Logout',
      },
    },
    views: {
      session: {
        new: {
          signIn: 'Login',
          submit: 'Login',
        },
      },
      users: {
        title: 'Users',
        id: 'ID',
        fullName: 'Full name',
        firstName: 'First name',
        lastName: 'Last name',
        email: 'Email',
        password: 'Password',
        createdAt: 'Created at',
        actions: 'Actions',
        new: {
          submit: 'Register',
          signUp: 'Register',
        },
        edit: {
          title: 'Edit user',
          submit: 'Update',
        },
        delete: 'Delete',
      },
      statuses: {
        id: 'ID',
        name: 'Name',
        createdAt: 'Created At',
        actions: 'Actions',
        index: {
          title: 'Statuses',
          createLink: 'Create Status',
          edit: 'Edit',
          delete: 'Delete',
        },
        new: {
          title: 'Create Status',
          submit: 'Create',
        },
        edit: {
          title: 'Edit Status',
          submit: 'Update',
          delete: 'Delete',
        },
      },
      tasks: {
        id: 'ID',
        name: 'Name',
        description: 'Description',
        status: 'Status',
        creator: 'Creator',
        executor: 'Executor',
        labels: 'Labels',
        createdAt: 'Created At',
        actions: 'Actions',
        index: {
          title: 'Tasks',
          createLink: 'Create Task',
          edit: 'Edit',
          delete: 'Delete',
        },
        new: {
          title: 'Create Task',
          submit: 'Create',
        },
        show: {
          edit: 'Edit',
        },
        edit: {
          title: 'Edit Task',
          submit: 'Update',
          delete: 'Delete',
        },
      },
      labels: {
        id: 'ID',
        name: 'Name',
        createdAt: 'Created At',
        actions: 'Actions',
        index: {
          title: 'Labels',
          createLink: 'Create Label',
          edit: 'Edit',
          delete: 'Delete',
        },
        new: {
          title: 'Create Label',
          submit: 'Create',
        },
        edit: {
          title: 'Edit Label',
          submit: 'Update',
          delete: 'Delete',
        },
      },
      welcome: {
        index: {
          hello: 'Hello from Hexlet!',
          description: 'Practical programming courses',
          more: 'Learn more',
        },
      },
    },
  },
}
