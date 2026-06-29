grep -rn "status: 'pending'" --include="*.ts" --include="*.sql" .
grep -rn "Booking Confirmation\|trigger_type" --include="*.ts" --include="*.sql" .
grep -rn "from('notifications').insert\|notifications.*insert" --include="*.ts" .