# @fileoverview Освобождение файлового кеша PostgreSQL без изменения файлов базы.
use strict;
use warnings;
use File::Find;
use Cwd qw(abs_path);
use Fcntl qw(O_RDONLY O_NOFOLLOW);
require 'syscall.ph';
alarm 30;
{ local $/; my $input = <STDIN>; }
my $data = abs_path($ENV{PGDATA} // '');
die 'Invalid PGDATA' unless $data && -f "$data/PG_VERSION";
my ($count, $errors) = (0, 0);
for my $part ('base', 'global', 'pg_wal') {
    my $root = abs_path("$data/$part");
    die 'Invalid directory' unless $root && index($root, "$data/") == 0;
    find({no_chdir => 1, wanted => sub {
        return if -l $_ || !-f $_;
        die 'File limit exceeded' if ++$count > 10000;
        # Открытие без записи и перехода по символическим ссылкам.
        sysopen(my $fd, $File::Find::name, O_RDONLY | O_NOFOLLOW) or return;
        my $rc = syscall(SYS_fadvise64(), fileno($fd), 0, 0, 4);
        close $fd;
        die 'Cache advice failed' if $rc != 0 && ++$errors >= 5;
    }}, $root);
}
die 'Cache advice errors' if $errors;
