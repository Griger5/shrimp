<script setup lang="ts">
definePageMeta({
	middleware: ["logged-in"],
});

const { t } = useI18n();

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
	<h1>{{ t("register.title") }}</h1>
	<form @submit.prevent="register">
		<input
			v-model="credentials.username"
			type="text"
			:placeholder="t('register.username')"
			required
		>
		<input
			v-model="credentials.email"
			type="email"
			:placeholder="t('register.email')"
			required
		>
		<input
			v-model="credentials.password"
			type="password"
			:placeholder="t('register.password')"
			required 
		>
		<button type="submit">
			{{ t("register.title") }}
		</button>
	</form>

	<NuxtLink to="/login">{{ t("register.account") }}</NuxtLink>
</template>
