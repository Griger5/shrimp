<script setup lang="ts">
definePageMeta({
	middleware: ["logged-in"],
});

const { fetch: refreshSession } = useUserSession();

const credentials = reactive({
	username: "",
	email: "",
	password: "",
});

async function register() {
	const { data, error } = await useFetch("/api/register", {
		method: "POST",
		body: credentials,
	});

	if (error.value?.statusCode) {
		if ([400, 409].includes(error.value.statusCode)) {
			alert(error.value.statusMessage);
		}
		else {
			alert("An account could not be created. Please try again later.");
		}

		return;
	}

	await refreshSession();
	await navigateTo("/");
}
</script>

<template>
	<h1>Register</h1>
	<form @submit.prevent="register">
		<input
			v-model="credentials.username"
			type="text"
			placeholder="Username"
			required
		>
		<input
			v-model="credentials.email"
			type="email"
			placeholder="Email"
			required
		>
		<input
			v-model="credentials.password"
			type="password"
			placeholder="Password"
			required
		>
		<button type="submit">
			Register
		</button>
	</form>

	<NuxtLink to="/login">Already have an account?</NuxtLink>
</template>
