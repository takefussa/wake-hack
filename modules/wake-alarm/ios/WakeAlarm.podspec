Pod::Spec.new do |s|
  s.name           = 'WakeAlarm'
  s.version        = '0.1.0'
  s.summary        = 'AlarmKit bridge for Wake Hack'
  s.description    = 'A local Expo module that schedules Wake Hack alarms with AlarmKit.'
  s.license        = { :type => 'MIT' }
  s.author         = 'Wake Hack'
  s.homepage       = 'https://example.invalid/wake-hack'
  s.platform       = :ios, '15.1'
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift}'
end
