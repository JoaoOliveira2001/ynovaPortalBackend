const UUID_REGEX =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/i;

export const isValidUuid = (value: string | null | undefined): boolean => {
  if (!value) {
    return false;
  }
  return UUID_REGEX.test(value);
};

export { UUID_REGEX };
