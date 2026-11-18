# Makefile: proyek kecil dengan dependensi header otomatis (-MMD -MP).
CC     := gcc
CFLAGS := -std=c11 -Wall -Wextra -O2 -MMD -MP
OBJS   := main.o util.o lib.o

prog: $(OBJS)
	$(CC) -o $@ $^

%.o: %.c
	$(CC) $(CFLAGS) -c -o $@ $<

-include $(OBJS:.o=.d)

.PHONY: test clean
test: prog
	./prog

clean:
	rm -f prog *.o *.d
