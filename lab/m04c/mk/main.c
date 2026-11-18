#include <stdio.h>
#include "util.h"
#include "config.h"
int main(void) {
    printf("mac(2,5,1) = %ld, twice(21) = %ld\n", mac(2, 5, 1), lib_twice(21));
    return 0;
}
