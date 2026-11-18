/* proc.c: proses, fork, copy-on-write, waitpid, dan stack overflow yang dibunuh sinyal. Linux saja. */
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <unistd.h>
#include <signal.h>
#include <sys/wait.h>
#include <sys/mman.h>
#include <sys/resource.h>
#include <assert.h>

static int nilai = 1;                                  /* variabel global: alamat virtual sama di induk dan anak */

#pragma GCC diagnostic ignored "-Winfinite-recursion"   /* sengaja: rekursi tak berhingga adalah yang didemonstrasikan */
static long rekursi(long n) {                          /* tak ada tail-call pada -O0: satu frame per panggilan */
    volatile char pad[64]; pad[0] = (char)n;
    return rekursi(n + 1) + pad[0];
}

static int jalankan_dan_tunggu(void (*fungsi)(void)) {
    pid_t pid = fork();
    assert(pid >= 0);
    if (pid == 0) { fungsi(); _exit(0); }
    int status = 0; waitpid(pid, &status, 0);
    return status;
}

static void anak_keluar7(void) { _exit(7); }
static void anak_overflow(void) {
    struct rlimit rl = { 256 * 1024, 256 * 1024 };     /* batasi stack anak menjadi 256 KB agar cepat habis */
    setrlimit(RLIMIT_STACK, &rl);
    signal(SIGSEGV, SIG_DFL);
    (void)rekursi(0);
}

int main(void) {
    int st = jalankan_dan_tunggu(anak_keluar7);
    printf("anak keluar normal: %s, kode %d\n", WIFEXITED(st) ? "ya" : "tidak", WEXITSTATUS(st));
    assert(WIFEXITED(st) && WEXITSTATUS(st) == 7);

    /* copy-on-write: alamat virtual sama, nilai berbeda setelah anak menulis */
    int *p = &nilai;
    int *share = mmap(NULL, sizeof(int), PROT_READ | PROT_WRITE, MAP_SHARED | MAP_ANONYMOUS, -1, 0);
    assert(share != MAP_FAILED);
    *share = 0;
    pid_t pid = fork();
    assert(pid >= 0);
    if (pid == 0) {
        nilai = 2;                                     /* menulis salinan pribadi anak */
        share[0] = (int)((uintptr_t)p == (uintptr_t)&nilai);   /* kirim "alamat sama" lewat memori bersama */
        _exit(nilai);
    }
    int s2 = 0; waitpid(pid, &s2, 0);
    printf("alamat variabel sama di anak: %s; nilai anak = %d, nilai induk = %d\n", *share == 1 ? "ya" : "tidak", WEXITSTATUS(s2), nilai);
    assert(*share == 1 && WEXITSTATUS(s2) == 2 && nilai == 1);

    int s3 = jalankan_dan_tunggu(anak_overflow);
    printf("rekursi tak berhingga: dibunuh sinyal? %s, sinyal %d (%s)\n", WIFSIGNALED(s3) ? "ya" : "tidak", WIFSIGNALED(s3) ? WTERMSIG(s3) : 0,
           WIFSIGNALED(s3) && WTERMSIG(s3) == SIGSEGV ? "SIGSEGV" : "lain");
    assert(WIFSIGNALED(s3) && WTERMSIG(s3) == SIGSEGV);
    printf("semua pemeriksaan proc.c lulus\n");
    return 0;
}
