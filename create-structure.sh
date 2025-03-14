#!/bin/bash

# Navigate to your project directory (uncomment and modify if needed)
# cd ~/path/to/your/projects

# Create the base directory
mkdir -p TaskManagerApp

# Create root directories
mkdir -p TaskManagerApp/src/app/core/{guards,interceptors,models,services}
mkdir -p TaskManagerApp/src/app/features/auth/{login,register,forgot-password}
mkdir -p TaskManagerApp/src/app/features/dashboard/components/{task-summary,project-progress,upcoming-tasks,recent-activities}
mkdir -p TaskManagerApp/src/app/features/tasks/{task-list,task-detail,task-form,task-board,task-attachments}
mkdir -p TaskManagerApp/src/app/features/calendar/{calendar-view,day-view,week-view,month-view,calendar-event-form}
mkdir -p TaskManagerApp/src/app/features/projects/{project-list,project-detail,project-form}
mkdir -p TaskManagerApp/src/app/features/file-manager/{file-list,file-upload,file-preview,pdf-viewer,image-viewer}
mkdir -p TaskManagerApp/src/app/features/reports/{task-reports,user-reports,project-reports}
mkdir -p TaskManagerApp/src/app/features/settings/{profile-settings,notification-settings,team-settings}
mkdir -p TaskManagerApp/src/app/shared/components/{header,sidebar,task-card,file-dropzone,loading-spinner,confirmation-dialog,notification-toast}
mkdir -p TaskManagerApp/src/app/shared/{directives,pipes}
mkdir -p TaskManagerApp/src/assets/images/{avatars,icons,placeholders}
mkdir -p TaskManagerApp/src/assets/{i18n,fonts}
mkdir -p TaskManagerApp/src/environments
mkdir -p TaskManagerApp/src/theme

# Loop through and create files in core directory
for file in auth admin; do
  touch TaskManagerApp/src/app/core/guards/${file}.guard.ts
done

for file in auth error; do
  touch TaskManagerApp/src/app/core/interceptors/${file}.interceptor.ts
done

for file in task user project attachment tag comment notification; do
  touch TaskManagerApp/src/app/core/models/${file}.model.ts
done

for file in auth task project calendar file-upload notification user storage; do
  touch TaskManagerApp/src/app/core/services/${file}.service.ts
done

touch TaskManagerApp/src/app/core/core.module.ts

# Create files for feature modules
# Auth module
for component in login register forgot-password; do
  for ext in ts html scss; do
    touch TaskManagerApp/src/app/features/auth/${component}/${component}.component.${ext}
  done
done
touch TaskManagerApp/src/app/features/auth/auth.module.ts

# Dashboard module
for component in task-summary project-progress upcoming-tasks recent-activities; do
  for ext in ts html scss; do
    touch TaskManagerApp/src/app/features/dashboard/components/${component}/${component}.component.${ext}
  done
done
for ext in ts html scss; do
  touch TaskManagerApp/src/app/features/dashboard/dashboard.component.${ext}
done
touch TaskManagerApp/src/app/features/dashboard/dashboard.module.ts

# Tasks module
for component in task-list task-detail task-form task-board task-attachments; do
  for ext in ts html scss; do
    touch TaskManagerApp/src/app/features/tasks/${component}/${component}.component.${ext}
  done
done
touch TaskManagerApp/src/app/features/tasks/tasks.module.ts

# Calendar module
for component in calendar-view day-view week-view month-view calendar-event-form; do
  for ext in ts html scss; do
    touch TaskManagerApp/src/app/features/calendar/${component}/${component}.component.${ext}
  done
done
touch TaskManagerApp/src/app/features/calendar/calendar.module.ts

# Projects module
for component in project-list project-detail project-form; do
  for ext in ts html scss; do
    touch TaskManagerApp/src/app/features/projects/${component}/${component}.component.${ext}
  done
done
touch TaskManagerApp/src/app/features/projects/projects.module.ts

# File manager module
for component in file-list file-upload file-preview pdf-viewer image-viewer; do
  for ext in ts html scss; do
    touch TaskManagerApp/src/app/features/file-manager/${component}/${component}.component.${ext}
  done
done
touch TaskManagerApp/src/app/features/file-manager/file-manager.module.ts

# Reports module
for component in task-reports user-reports project-reports; do
  for ext in ts html scss; do
    touch TaskManagerApp/src/app/features/reports/${component}/${component}.component.${ext}
  done
done
touch TaskManagerApp/src/app/features/reports/reports.module.ts

# Settings module
for component in profile-settings notification-settings team-settings; do
  for ext in ts html scss; do
    touch TaskManagerApp/src/app/features/settings/${component}/${component}.component.${ext}
  done
done
touch TaskManagerApp/src/app/features/settings/settings.module.ts

# Shared module components
for component in header sidebar task-card file-dropzone loading-spinner confirmation-dialog notification-toast; do
  for ext in ts html scss; do
    touch TaskManagerApp/src/app/shared/components/${component}/${component}.component.${ext}
  done
done

# Shared directives
for directive in drag-drop file-size-validator click-outside; do
  touch TaskManagerApp/src/app/shared/directives/${directive}.directive.ts
done

# Shared pipes
for pipe in file-size task-status time-ago safe-url; do
  touch TaskManagerApp/src/app/shared/pipes/${pipe}.pipe.ts
done

touch TaskManagerApp/src/app/shared/shared.module.ts

# App root files
for ext in ts html scss; do
  touch TaskManagerApp/src/app/app.component.${ext}
done
touch TaskManagerApp/src/app/app.module.ts
touch TaskManagerApp/src/app/app-routing.module.ts

# Assets files
touch TaskManagerApp/src/assets/images/logo.svg
touch TaskManagerApp/src/assets/i18n/en.json
touch TaskManagerApp/src/assets/i18n/es.json

# Environment files
touch TaskManagerApp/src/environments/environment.ts
touch TaskManagerApp/src/environments/environment.prod.ts

# Theme files
touch TaskManagerApp/src/theme/_variables.scss
touch TaskManagerApp/src/theme/_mixins.scss
touch TaskManagerApp/src/theme/_custom.scss

# Root files
touch TaskManagerApp/src/index.html
touch TaskManagerApp/src/main.ts
touch TaskManagerApp/src/styles.scss
touch TaskManagerApp/angular.json
touch TaskManagerApp/package.json
touch TaskManagerApp/README.md
touch TaskManagerApp/tailwind.config.js
touch TaskManagerApp/tsconfig.app.json
touch TaskManagerApp/tsconfig.json
touch TaskManagerApp/tsconfig.spec.json

echo "Task Manager App structure has been created successfully!"

