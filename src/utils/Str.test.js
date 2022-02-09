const Str = require('./Str');


describe('Str', () => {
  describe('.firstIndexOf()', () => {
    it('finds the starting index of the first match', () => {
      const index = Str.firstIndexOf('foo bar baz foo bar baz', 'bar');
      expect(index).toBe(4);
    });

    it('finds the ending index of the first match', () => {
      const index = Str.firstIndexOf('foo bar baz foo bar baz', 'bar', true);
      expect(index).toBe(7);
    });

    it('finds the starting index of the first regex match', () => {
      const index = Str.firstIndexOf('foo bar baz foo bar baz', /b[^ ]+r/);
      expect(index).toBe(4);
    });

    it('finds the ending index of the first regex match', () => {
      const index = Str.firstIndexOf('foo bar baz foo bar baz', /b[^ ]+r/, true);
      expect(index).toBe(7);
    });

    it('returns -1 when there are no matches', () => {
      const index = Str.firstIndexOf('foo bar baz foo bar baz', 'qux');
      expect(index).toBe(-1);
    });

    it('returns -1 when there are no regex matches', () => {
      const index = Str.firstIndexOf('foo bar baz foo bar baz', /qux/);
      expect(index).toBe(-1);
    });
  });

  describe('.lastIndexOf()', () => {
    it('finds the starting index of the first match', () => {
      const index = Str.lastIndexOf('foo bar baz foo bar baz', 'bar');
      expect(index).toBe(16);
    });

    it('finds the ending index of the first match', () => {
      const index = Str.lastIndexOf('foo bar baz foo bar baz', 'bar', true);
      expect(index).toBe(19);
    });

    it('finds the starting index of the first regex match', () => {
      const index = Str.lastIndexOf('foo bar baz foo bar baz', /b[^ ]+r/);
      expect(index).toBe(16);
    });

    it('finds the ending index of the first regex match', () => {
      const index = Str.lastIndexOf('foo bar baz foo bar baz', /b[^ ]+r/, true);
      expect(index).toBe(19);
    });

    it('returns -1 when there are no matches', () => {
      const index = Str.lastIndexOf('foo bar baz foo bar baz', 'qux');
      expect(index).toBe(-1);
    });

    it('returns -1 when there are no regex matches', () => {
      const index = Str.lastIndexOf('foo bar baz foo bar baz', /qux/);
      expect(index).toBe(-1);
    });
  });

  describe('.replaceTokens()', () => {
    it('replaces tokens in a string', () => {
      const str = Str.replaceTokens('__foo__ __bar__', { foo: '123', bar: 'abc' });
      expect(str).toBe('123 abc');
    });

    it('replaces tokens with a custom prefix and suffix', () => {
      const str = Str.replaceTokens('$[foo] $[bar]', { foo: '123', bar: 'abc' }, '$[', ']');
      expect(str).toBe('123 abc');
    });
  });

  describe('.tokens()', () => {
    it('finds all tokens in a string', () => {
      const tokens = Str.tokens('__foo__ __bar__');
      expect(tokens).toContain('foo');
      expect(tokens).toContain('bar');
    });

    it('finds all tokens with a custom prefix and suffix', () => {
      const tokens = Str.tokens('$[foo] $[bar]', '$[', ']');
      expect(tokens).toContain('foo');
      expect(tokens).toContain('bar');
    });
  });
});
